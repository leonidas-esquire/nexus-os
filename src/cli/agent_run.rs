use crate::agent::{self, AgentStatus};
use crate::audit;
use crate::error::Result;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn run(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let ag = agent::get_agent(&conn, name)?;

    if ag.status == AgentStatus::Running {
        return Err(crate::NexusError::Agent(format!(
            "Agent '{}' is already running",
            name
        )));
    }

    // Simulate starting the agent process
    let pid = std::process::id();
    agent::set_agent_status(&conn, name, AgentStatus::Running, Some(pid))?;

    audit::log_event(&conn, Some(name), "agent.started", Some(&format!("pid={}", pid)))?;

    success(&format!(
        "Agent '{}' started (pid: {})",
        name.bright_green(),
        pid
    ));

    Ok(())
}
