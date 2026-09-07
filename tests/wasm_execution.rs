use naos::wasm::{
    execute_wasm, execute_wasm_with_input, validate_wasm, SandboxConfig, MAX_INPUT_BYTES,
};
use std::fs;
use tempfile::TempDir;

fn module(wat: &str) -> (TempDir, std::path::PathBuf) {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("agent.wasm");
    fs::write(&path, wat::parse_str(wat).unwrap()).unwrap();
    (dir, path)
}

#[tokio::test]
async fn traps_and_invalid_modules_are_not_successes() {
    let (_dir, path) = module(r#"(module (func (export "_start") unreachable))"#);
    assert!(execute_wasm(&path, &SandboxConfig::default())
        .await
        .is_err());
    fs::write(&path, b"\0asmgarbage").unwrap();
    assert!(validate_wasm(&path).is_err());
    assert!(execute_wasm(&path, &SandboxConfig::default())
        .await
        .is_err());
    fs::remove_file(&path).unwrap();
    assert!(execute_wasm(&path, &SandboxConfig::default())
        .await
        .is_err());
}

#[tokio::test]
async fn missing_entrypoint_and_unknown_import_fail() {
    for wat in [
        r#"(module)"#,
        r#"(module (import "llm" "complete" (func)) (func (export "_start")))"#,
    ] {
        let (_dir, path) = module(wat);
        assert!(execute_wasm(&path, &SandboxConfig::default())
            .await
            .is_err());
    }
}

#[tokio::test]
async fn wasi_exit_codes_are_preserved() {
    for code in [0, 7] {
        let (_dir, path) = module(&format!(
            r#"(module
            (import "wasi_snapshot_preview1" "proc_exit" (func $exit (param i32)))
            (memory (export "memory") 1)
            (func (export "_start") i32.const {code} call $exit))"#
        ));
        assert_eq!(
            execute_wasm(&path, &SandboxConfig::default())
                .await
                .unwrap()
                .exit_code,
            code
        );
    }
}

#[tokio::test]
async fn memory_and_fuel_limits_cover_instantiation_and_execution() {
    for wat in [
        r#"(module (memory 2000) (func (export "_start")))"#,
        r#"(module (memory 1) (func (export "_start") i32.const 2000 memory.grow drop))"#,
        r#"(module (func (export "_start") (loop $forever br $forever)))"#,
        r#"(module (func $init (loop $forever br $forever)) (start $init) (func (export "_start")))"#,
    ] {
        let (_dir, path) = module(wat);
        let config = SandboxConfig {
            fuel: 1_000,
            ..Default::default()
        };
        assert!(execute_wasm(&path, &config).await.is_err());
    }
}

#[tokio::test]
async fn wall_deadline_interrupts_even_when_fuel_remains() {
    let (_dir, path) = module(r#"(module (func (export "_start") (loop $forever br $forever)))"#);
    let config = SandboxConfig {
        fuel: u64::MAX,
        timeout_secs: 1,
        ..Default::default()
    };
    let error = execute_wasm(&path, &config).await.unwrap_err().to_string();
    assert!(error.contains("timed out"), "{error}");
}

#[tokio::test]
async fn host_environment_and_directories_are_not_inherited() {
    let (_dir, path) = module(
        r#"(module
        (import "wasi_snapshot_preview1" "environ_sizes_get" (func $env (param i32 i32) (result i32)))
        (import "wasi_snapshot_preview1" "fd_prestat_get" (func $prestat (param i32 i32) (result i32)))
        (memory (export "memory") 1)
        (func (export "_start")
            i32.const 0 i32.const 4 call $env if unreachable end
            i32.const 0 i32.load if unreachable end
            i32.const 4 i32.load if unreachable end
            i32.const 3 i32.const 8 call $prestat i32.const 8 i32.ne if unreachable end))"#,
    );
    assert_eq!(
        execute_wasm(&path, &SandboxConfig::default())
            .await
            .unwrap()
            .exit_code,
        0
    );
    for config in [
        SandboxConfig {
            allow_fs: true,
            ..Default::default()
        },
        SandboxConfig {
            allow_network: true,
            ..Default::default()
        },
    ] {
        assert!(execute_wasm(&path, &config).await.is_err());
    }
}

#[tokio::test]
async fn oversized_input_is_rejected() {
    let (_dir, path) = module(r#"(module (func (export "_start")))"#);
    assert!(execute_wasm_with_input(
        &path,
        &SandboxConfig::default(),
        &vec![0; MAX_INPUT_BYTES + 1]
    )
    .await
    .is_err());
}

#[tokio::test]
async fn output_limit_is_a_failure_even_if_guest_ignores_write_errors() {
    let (_dir, path) = module(
        r#"(module
        (import "wasi_snapshot_preview1" "fd_write" (func $write (param i32 i32 i32 i32) (result i32)))
        (memory (export "memory") 2)
        (func (export "_start") (local $i i32)
            i32.const 0 i32.const 1024 i32.store
            i32.const 4 i32.const 65536 i32.store
            (loop $again
                i32.const 1 i32.const 0 i32.const 1 i32.const 8 call $write drop
                local.get $i i32.const 1 i32.add local.tee $i
                i32.const 20 i32.lt_u br_if $again)))"#,
    );
    assert!(execute_wasm(&path, &SandboxConfig::default())
        .await
        .is_err());
}
