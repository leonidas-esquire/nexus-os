use crate::agent;
use crate::audit;
use crate::error::Result;
use super::{open_project_db, success};

pub async fn run(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    agent::delete_agent(&conn, name)?;
    audit::log_event(&conn, Some(name), "agent.deleted", None)?;
    success(&format!("Agent '{}' deleted", name));
    Ok(())
}
