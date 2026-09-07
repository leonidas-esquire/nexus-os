use assert_cmd::Command;
use naos::{db, marketplace};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::net::TcpListener;
use tempfile::TempDir;

fn fixture(tamper: bool, approved: bool) -> (String, std::thread::JoinHandle<()>) {
    let wasm = wat::parse_str(r#"(module
      (import "wasi_snapshot_preview1" "fd_write" (func $write (param i32 i32 i32 i32) (result i32)))
      (memory (export "memory") 1)
      (data (i32.const 16) "registry-ok\n")
      (func (export "_start")
        (i32.store (i32.const 0) (i32.const 16))
        (i32.store (i32.const 4) (i32.const 12))
        (drop (call $write (i32.const 1) (i32.const 0) (i32.const 1) (i32.const 8)))))"#).unwrap();
    let digest = if tamper {
        "0".repeat(64)
    } else {
        format!("{:x}", Sha256::digest(&wasm))
    };
    let release = json!({"name":"test-skill","version":"1.0.0","status":if approved {"approved"} else {"pending"},"sha256":digest,"size":wasm.len(),"manifest":{"schemaVersion":1,"name":"test-skill","version":"1.0.0","runtime":"wasip1-command","entrypoint":"_start","pricing":"free","description":"CLI test"}}).to_string().into_bytes();
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    let handle = std::thread::spawn(move || {
        for (index, body) in [release, wasm].into_iter().enumerate() {
            if index == 1 && !approved {
                break;
            }
            let (mut stream, _) = listener.accept().unwrap();
            stream
                .set_read_timeout(Some(std::time::Duration::from_secs(10)))
                .unwrap();
            let mut request = Vec::new();
            let mut byte = [0u8; 1];
            while !request.ends_with(b"\r\n\r\n") {
                stream.read_exact(&mut byte).unwrap();
                request.push(byte[0]);
            }
            let expected = if index == 0 {
                "GET /api/marketplace/skills/test-skill/1.0.0 "
            } else {
                "GET /api/marketplace/skills/test-skill/1.0.0/package "
            };
            assert!(String::from_utf8_lossy(&request).starts_with(expected));
            write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len()).unwrap();
            stream.write_all(&body).unwrap();
        }
    });
    (url, handle)
}
fn project() -> TempDir {
    let dir = TempDir::new().unwrap();
    std::fs::write(
        dir.path().join("nexus.config.yaml"),
        "name: registry-test\n",
    )
    .unwrap();
    dir
}
#[test]
fn verified_install_can_execute_offline() {
    let dir = project();
    let (url, server) = fixture(false, true);
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .env("NEXUS_REGISTRY_URL", url)
        .args(["marketplace", "install", "test-skill@1.0.0"])
        .assert()
        .success();
    server.join().unwrap();
    let conn = db::open_db(dir.path()).unwrap();
    let skills = marketplace::list_skills(&conn).unwrap();
    assert_eq!(skills.len(), 1);
    let path = skills[0].wasm_path.as_ref().unwrap();
    assert!(std::path::Path::new(path).is_file());
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .args(["create", "installed", "--source", path])
        .assert()
        .success();
    Command::cargo_bin("naos")
        .unwrap()
        .current_dir(dir.path())
        .env_remove("OPENAI_API_KEY")
        .env_remove("ANTHROPIC_API_KEY")
        .env("HTTPS_PROXY", "http://127.0.0.1:1")
        .env("HTTP_PROXY", "http://127.0.0.1:1")
        .args(["run", "installed"])
        .assert()
        .success()
        .stdout("registry-ok\n");
}
#[test]
fn tampered_and_unapproved_packages_are_never_installed() {
    for (tampered, approved) in [(true, true), (false, false)] {
        let dir = project();
        let (url, server) = fixture(tampered, approved);
        Command::cargo_bin("naos")
            .unwrap()
            .current_dir(dir.path())
            .env("NEXUS_REGISTRY_URL", url)
            .args(["marketplace", "install", "test-skill@1.0.0"])
            .assert()
            .failure();
        server.join().unwrap();
        let conn = db::open_db(dir.path()).unwrap();
        assert!(marketplace::list_skills(&conn).unwrap().is_empty());
        assert!(!dir.path().join("skills").exists());
    }
}
#[test]
fn path_traversal_and_plain_http_are_rejected() {
    let dir = project();
    for (registry, name) in [
        ("http://example.com", "test-skill"),
        ("https://example.com", "../escape"),
        ("https://example.com", "test-skill@../../escape"),
    ] {
        Command::cargo_bin("naos")
            .unwrap()
            .current_dir(dir.path())
            .env("NEXUS_REGISTRY_URL", registry)
            .args(["marketplace", "install", name])
            .assert()
            .failure();
    }
}
