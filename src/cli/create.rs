use crate::agent;
use crate::error::Result;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn run(name: &str, template: &str) -> Result<()> {
    if !agent::TEMPLATES.contains(&template) {
        return Err(crate::NexusError::Agent(format!(
            "Unknown template '{}'. Available: {}",
            template,
            agent::TEMPLATES.join(", ")
        )));
    }

    let conn = open_project_db()?;
    let agent = agent::create_agent(&conn, name, Some(template), None)?;

    success(&format!(
        "Agent ID: {}",
        agent.id.bright_blue()
    ));

    Ok(())
}
