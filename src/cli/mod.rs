pub mod agent_run;
pub mod agent_stop;
pub mod audit;
pub mod axis;
pub mod broker;
pub mod cost;
pub mod create;
pub mod dashboard;
pub mod delete;
pub mod edge;
pub mod init;
pub mod marketplace;
pub mod pool;
pub mod saga;
pub mod status;
pub mod supervisor;
pub mod workflow;

use crate::config;
use crate::db;
use crate::error::{NexusError, Result};
use colored::Colorize;
use rusqlite::Connection;
use std::env;
use std::path::PathBuf;

/// Locate the project root (directory containing nexus.config.yaml).
pub fn project_root() -> Result<PathBuf> {
    let cwd = env::current_dir()?;
    config::find_config(&cwd)
        .map(|p| p.parent().unwrap().to_path_buf())
        .ok_or_else(|| {
            NexusError::Config(
                "Not inside a Nexus OS project. Run `naos init <name>` first.".into(),
            )
        })
}

/// Open the project database with migrations applied.
pub fn open_project_db() -> Result<Connection> {
    let root = project_root()?;
    let conn = db::open_db(&root)?;
    db::migrate(&conn)?;
    Ok(conn)
}

/// Print a success line.
pub fn success(msg: &str) {
    println!("  {} {}", "✓".green(), msg);
}

/// Print an info line.
pub fn info(msg: &str) {
    println!("  {} {}", "ℹ".blue(), msg);
}
