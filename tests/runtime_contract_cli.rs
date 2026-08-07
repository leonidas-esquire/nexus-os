use assert_cmd::Command;
use predicates::prelude::*;
use serde_json::Value;
use std::fs;
use tempfile::TempDir;

fn project() -> TempDir {
    let temp = TempDir::new().unwrap();
    fs::write(
        temp.path().join("nexus.config.yaml"),
        "name: runtime-test\n",
    )
    .unwrap();
    temp
}

fn write_json(temp: &TempDir, name: &str, value: &Value) -> String {
    let path = temp.path().join(name);
    fs::write(&path, serde_json::to_vec(value).unwrap()).unwrap();
    path.to_string_lossy().to_string()
}

fn run_json(temp: &TempDir, args: &[&str]) -> Value {
    let output = Command::cargo_bin("naos")
        .unwrap()
        .current_dir(temp.path())
        .args(args)
        .assert()
        .success()
        .get_output()
        .stdout
        .clone();

    serde_json::from_slice(&output).unwrap()
}

fn registration() -> Value {
    serde_json::json!({
        "registrationId": "registration-1",
        "externalAgentId": "egov-agent-architect",
        "agentVersion": "1.0.0",
        "manifestDigest": "a".repeat(64),
        "registryRecordDigest": "b".repeat(64),
        "configurationDigest": "c".repeat(64),
        "registeredAt": "2026-08-07T06:00:00.000Z"
    })
}

fn submission(input_digest: &str) -> Value {
    serde_json::json!({
        "requestId": "submission-1",
        "idempotencyKey": "submission-key-1",
        "registrationId": "registration-1",
        "workPackageDigest": "d".repeat(64),
        "authorizationDigest": "e".repeat(64),
        "manifestDigest": "a".repeat(64),
        "registryRecordDigest": "b".repeat(64),
        "inputDigest": input_digest,
        "budget": {
            "maxCostUsd": 10.0,
            "timeoutMs": 60000,
            "maxRetries": 2,
            "maxConcurrency": 1
        },
        "submittedAt": "2026-08-07T06:01:00.000Z",
        "deadlineAt": "2026-08-07T06:10:00.000Z"
    })
}

#[test]
fn runtime_cli_exposes_exact_protocol_health() {
    let temp = project();
    let value = run_json(&temp, &["runtime", "health"]);

    assert_eq!(value["protocol"], "nexus-runtime");
    assert_eq!(value["protocolVersion"], "1.0.0");
    assert_eq!(value["ok"], true);
    assert_eq!(value["data"]["executionMode"], "control-plane-only");
    assert_eq!(value["data"]["supportsRealExecution"], false);
    assert!(value["build"]["sourceCommit"].as_str().unwrap().len() >= 8);
}

#[test]
fn runtime_cli_register_submit_cancel_and_evidence_are_machine_readable() {
    let temp = project();

    let registration_file = write_json(&temp, "registration.json", &registration());

    let registered = run_json(
        &temp,
        &[
            "runtime",
            "register-agent",
            "--request-file",
            &registration_file,
        ],
    );

    assert_eq!(registered["data"]["state"], "registered");

    let submission_file = write_json(&temp, "submission.json", &submission(&"f".repeat(64)));

    let submitted = run_json(
        &temp,
        &["runtime", "submit", "--request-file", &submission_file],
    );

    let execution_id = submitted["data"]["executionId"]
        .as_str()
        .unwrap()
        .to_string();

    assert_eq!(submitted["data"]["state"], "accepted");
    assert_eq!(submitted["data"]["supportsRealExecution"], false);

    let replayed = run_json(
        &temp,
        &["runtime", "submit", "--request-file", &submission_file],
    );

    assert_eq!(
        replayed["data"]["executionId"].as_str().unwrap(),
        execution_id
    );

    let inspected = run_json(&temp, &["runtime", "inspect", &execution_id]);
    assert_eq!(inspected["data"]["state"], "accepted");

    let event_batch = run_json(
        &temp,
        &["runtime", "events", &execution_id, "--max-events", "10"],
    );

    assert_eq!(event_batch["data"]["events"].as_array().unwrap().len(), 1);

    let cancellation = serde_json::json!({
        "requestId": "cancel-1",
        "executionId": execution_id,
        "workPackageDigest": "d".repeat(64),
        "authorizationDigest": "9".repeat(64),
        "reasonDigest": "8".repeat(64),
        "requestedAt": "2026-08-07T06:02:00.000Z"
    });

    let cancellation_file = write_json(&temp, "cancellation.json", &cancellation);

    let cancelled = run_json(
        &temp,
        &["runtime", "cancel", "--request-file", &cancellation_file],
    );

    assert_eq!(cancelled["data"]["state"], "cancelled");

    let evidence = run_json(
        &temp,
        &[
            "runtime",
            "evidence",
            cancellation["executionId"].as_str().unwrap(),
            "--collected-at",
            "2026-08-07T06:03:00.000Z",
            "--max-events",
            "100",
        ],
    );

    assert_eq!(evidence["data"]["terminalState"], "cancelled");
    assert_eq!(evidence["data"]["executionMode"], "control-plane-only");
    assert_eq!(evidence["data"]["supportsRealExecution"], false);
    assert_eq!(evidence["protocol"], "nexus-runtime");
}

#[test]
fn runtime_cli_returns_stable_json_error_on_idempotency_conflict() {
    let temp = project();

    let registration_file = write_json(&temp, "registration.json", &registration());

    run_json(
        &temp,
        &[
            "runtime",
            "register-agent",
            "--request-file",
            &registration_file,
        ],
    );

    let first_file = write_json(&temp, "first.json", &submission(&"f".repeat(64)));
    let second_file = write_json(&temp, "second.json", &submission(&"1".repeat(64)));

    run_json(&temp, &["runtime", "submit", "--request-file", &first_file]);

    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(temp.path())
        .args(["runtime", "submit", "--request-file", &second_file])
        .assert()
        .failure()
        .stderr(predicate::str::contains(
            "\"code\":\"nxrt-idempotency-conflict\"",
        ));
}
