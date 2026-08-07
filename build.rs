use std::process::Command;

fn command(args: &[&str]) -> Option<String> {
    let output = Command::new("git").args(args).output().ok()?;
    if !output.status.success() {
        return None;
    }

    let value = String::from_utf8(output.stdout).ok()?;
    let trimmed = value.trim();

    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn main() {
    let source_commit = command(&["rev-parse", "HEAD"]).unwrap_or_else(|| "unverified".to_string());

    let dirty = Command::new("git")
        .args(["status", "--porcelain", "--untracked-files=no"])
        .output()
        .map(|output| {
            !output.status.success() || !String::from_utf8_lossy(&output.stdout).trim().is_empty()
        })
        .unwrap_or(true);

    println!("cargo:rustc-env=NEXUS_SOURCE_COMMIT={source_commit}");
    println!("cargo:rustc-env=NEXUS_SOURCE_DIRTY={dirty}");
    println!("cargo:rerun-if-changed=.git/HEAD");
    println!("cargo:rerun-if-changed=.git/index");
}
