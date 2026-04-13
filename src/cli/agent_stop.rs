use crate::agent::{self, AgentStatus};
use crate::audit;
use crate::error::Result;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn run(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let ag = agent::get_agent(&conn, name)?;

    if ag.status == AgentStatus::Stopped {
        return Err(crate::NexusError::Agent(format!(
            "Agent '{}' is already stopped",
            name
        )));
    }

    agent::set_agent_status(&conn, name, AgentStatus::Stopped, None)?;
    audit::log_event(&conn, Some(name), "agent.stopped", None)?;

    success(&format!("Agent '{}' stopped", name.yellow()));

    Ok(())
}
