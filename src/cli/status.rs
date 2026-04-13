use crate::agent;
use crate::error::Result;
use super::open_project_db;
use colored::Colorize;
use tabled::{Table, Tabled};

#[derive(Tabled)]
struct AgentRow {
    #[tabled(rename = "NAME")]
    name: String,
    #[tabled(rename = "STATUS")]
    status: String,
    #[tabled(rename = "ID")]
    id: String,
}

pub async fn run() -> Result<()> {
    let conn = open_project_db()?;
    let agents = agent::list_agents(&conn)?;

    if agents.is_empty() {
        println!("  No agents found. Create one with `naos create <name>`.");
        return Ok(());
    }

    let rows: Vec<AgentRow> = agents
        .iter()
        .map(|a| {
            let status_str = match a.status {
                agent::AgentStatus::Running => format!("● {}", "running".green()),
                agent::AgentStatus::Stopped => format!("○ {}", "stopped".dimmed()),
                agent::AgentStatus::Crashed => format!("✕ {}", "crashed".red()),
                agent::AgentStatus::Paused => format!("◑ {}", "paused".yellow()),
            };
            AgentRow {
                name: a.name.clone(),
                status: status_str,
                id: a.id.clone(),
            }
        })
        .collect();

    let table = Table::new(rows)
        .with(tabled::settings::Style::blank())
        .to_string();

    println!("{}", table);

    Ok(())
}
