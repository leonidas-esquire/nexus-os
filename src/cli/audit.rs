use crate::audit as a;
use crate::error::Result;
use super::open_project_db;
use colored::Colorize;

pub async fn tail(lines: usize) -> Result<()> {
    let conn = open_project_db()?;
    let entries = a::tail(&conn, lines)?;
    if entries.is_empty() {
        println!("  No audit entries found.");
        return Ok(());
    }
    for entry in entries {
        let agent = entry.agent_name.unwrap_or_else(|| "system".to_string());
        println!(
            "  {} [L{}] {} {} {}",
            entry.timestamp.dimmed(),
            entry.lamport,
            agent.bright_cyan(),
            entry.event_type.bright_yellow(),
            entry.detail.unwrap_or_default().dimmed()
        );
    }
    Ok(())
}

pub async fn search(query: &str) -> Result<()> {
    let conn = open_project_db()?;
    let entries = a::search(&conn, query)?;
    if entries.is_empty() {
        println!("  No matching audit entries found.");
        return Ok(());
    }
    for entry in entries {
        let agent = entry.agent_name.unwrap_or_else(|| "system".to_string());
        println!(
            "  {} [L{}] {} {} {}",
            entry.timestamp.dimmed(),
            entry.lamport,
            agent.bright_cyan(),
            entry.event_type.bright_yellow(),
            entry.detail.unwrap_or_default().dimmed()
        );
    }
    Ok(())
}
