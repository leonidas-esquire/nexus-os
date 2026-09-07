use assert_cmd::Command;
use naos::{agent, audit, db};
use predicates::prelude::*;
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::sync::OnceLock;
use tempfile::TempDir;

fn sample_module() -> &'static PathBuf {
    static MODULE: OnceLock<PathBuf> = OnceLock::new();
    MODULE.get_or_init(|| {
        let example =
            PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("examples/deterministic-agent");
        let target = example.join("target");
        let status = std::process::Command::new(env!("CARGO"))
            .args([
                "build",
                "--release",
                "--target",
                "wasm32-wasip1",
                "--manifest-path",
            ])
            .arg(example.join("Cargo.toml"))
            .arg("--target-dir")
            .arg(&target)
            .status()
            .expect("build deterministic WASM sample");
        assert!(
            status.success(),
            "Install the guest target: rustup target add wasm32-wasip1"
        );
        target.join("wasm32-wasip1/release/record-total-agent.wasm")
    })
}

fn project() -> TempDir {
    let dir = TempDir::new().unwrap();
    fs::write(dir.path().join("nexus.config.yaml"), "name: offline-test\n").unwrap();
    fs::copy(sample_module(), dir.path().join("agent.wasm")).unwrap();
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .args(["create", "records", "--source", "agent.wasm"])
        .assert()
        .success();
    dir
}

fn offline_command(dir: &TempDir) -> Command {
    let mut command = Command::cargo_bin("naos").unwrap();
    command
        .current_dir(dir.path())
        .env_remove("OPENAI_API_KEY")
        .env_remove("ANTHROPIC_API_KEY")
        .env_remove("GEMINI_API_KEY")
        .env("OPENAI_BASE_URL", "http://127.0.0.1:1")
        .env("ANTHROPIC_BASE_URL", "http://127.0.0.1:1")
        .env("HTTP_PROXY", "http://127.0.0.1:1")
        .env("HTTPS_PROXY", "http://127.0.0.1:1")
        .env("ALL_PROXY", "http://127.0.0.1:1")
        .env("NO_PROXY", "");
    command
}

#[test]
fn real_record_validation_and_totals_work_without_llm_and_produce_evidence() {
    let dir = project();
    for (input, count, total) in [
        (
            json!({"records":[{"id":"a","amount_cents":1250},{"id":"b","amount_cents":2750}]}),
            2,
            4000,
        ),
        (
            json!({"records":[{"id":"different","amount_cents":37}]}),
            1,
            37,
        ),
        (json!({"records":[]}), 0, 0),
    ] {
        let output = offline_command(&dir)
            .args(["run", "records", "--input", "-"])
            .write_stdin(input.to_string())
            .assert()
            .success()
            .get_output()
            .stdout
            .clone();
        let actual: Value = serde_json::from_slice(&output).unwrap();
        assert_eq!(
            actual,
            json!({"valid":true,"record_count":count,"total_cents":total})
        );
    }
    let conn = db::open_db(dir.path()).unwrap();
    let agent = agent::get_agent(&conn, "records").unwrap();
    assert_eq!(agent.status, agent::AgentStatus::Stopped);
    assert_eq!(agent.pid, None);
    let events = audit::tail(&conn, 100).unwrap();
    assert_eq!(
        events
            .iter()
            .filter(|e| e.event_type == "agent.completed")
            .count(),
        3
    );
    assert!(events
        .iter()
        .any(|e| e.detail.as_deref() == Some("runtime=wasm model_required=false")));
}

#[test]
fn invalid_records_fail_and_do_not_prevent_the_next_valid_task() {
    let dir = project();
    for input in [
        json!({"records":[{"id":"a","amount_cents":1},{"id":"a","amount_cents":2}]}),
        json!({"records":[{"id":"missing-amount"}]}),
        json!({"records":[{"id":"negative","amount_cents":-1}]}),
        json!({"records":[{"id":"","amount_cents":1}]}),
        json!({"records":[{"id":"a","amount_cents":u64::MAX},{"id":"b","amount_cents":1}]}),
    ] {
        offline_command(&dir)
            .args(["run", "records", "--input", "-"])
            .write_stdin(input.to_string())
            .assert()
            .failure()
            .stdout("")
            .stderr(predicate::str::contains("exited with code 2"));
    }
    let conn = db::open_db(dir.path()).unwrap();
    assert_eq!(
        agent::get_agent(&conn, "records").unwrap().status,
        agent::AgentStatus::Crashed
    );
    assert_eq!(
        audit::tail(&conn, 100)
            .unwrap()
            .iter()
            .filter(|e| e.event_type == "agent.failed")
            .count(),
        5
    );
    offline_command(&dir)
        .args(["run", "records", "--input", "-"])
        .write_stdin(r#"{"records":[]}"#)
        .assert()
        .success();
}

#[test]
fn failed_module_and_missing_source_never_report_completion() {
    let dir = project();
    fs::write(dir.path().join("agent.wasm"), b"\0asmgarbage").unwrap();
    offline_command(&dir)
        .args(["run", "records"])
        .assert()
        .failure();
    let conn = db::open_db(dir.path()).unwrap();
    assert_eq!(
        agent::get_agent(&conn, "records").unwrap().status,
        agent::AgentStatus::Crashed
    );
    assert!(!audit::tail(&conn, 100)
        .unwrap()
        .iter()
        .any(|e| e.event_type == "agent.completed"));
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .args(["create", "unbound"])
        .assert()
        .success();
    offline_command(&dir)
        .args(["run", "unbound"])
        .assert()
        .failure()
        .stderr(predicate::str::contains("has no WASM source"));
}

#[test]
fn configured_source_resolves_from_project_root_and_input_file_is_supported() {
    let dir = project();
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .args(["create", "configured"])
        .assert()
        .success();
    fs::write(
        dir.path().join("nexus.config.yaml"),
        "name: offline-test\nagents:\n  configured:\n    source: agent.wasm\n",
    )
    .unwrap();
    fs::create_dir(dir.path().join("nested")).unwrap();
    fs::write(
        dir.path().join("nested/input.json"),
        r#"{"records":[{"id":"file","amount_cents":99}]}"#,
    )
    .unwrap();
    let output = offline_command(&dir)
        .current_dir(dir.path().join("nested"))
        .args(["run", "configured", "--input", "input.json"])
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();
    assert_eq!(
        serde_json::from_slice::<Value>(&output).unwrap()["total_cents"],
        99
    );
}

#[test]
fn running_and_paused_agents_cannot_be_started_again() {
    let dir = project();
    let conn = db::open_db(dir.path()).unwrap();
    for status in [agent::AgentStatus::Running, agent::AgentStatus::Paused] {
        agent::set_agent_status(&conn, "records", status, None).unwrap();
        offline_command(&dir)
            .args(["run", "records"])
            .assert()
            .failure();
        assert_eq!(agent::get_agent(&conn, "records").unwrap().status, status);
    }
}
