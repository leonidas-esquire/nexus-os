use crate::audit;
use crate::error::Result;
use crate::supervisor as sup;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn create(name: &str, strategy: &str, max_restarts: u32) -> Result<()> {
    let conn = open_project_db()?;
    let sv = sup::create_supervisor(&conn, name, strategy, max_restarts)?;
    audit::log_event(&conn, None, "supervisor.created", Some(&format!("name={} strategy={}", name, strategy)))?;
    success(&format!("Supervisor '{}' created (strategy: {}, max-restarts: {})", name.bright_cyan(), sv.strategy, sv.max_restarts));
    Ok(())
}

pub async fn add(supervisor: &str, agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    sup::add_child(&conn, supervisor, agent)?;
    audit::log_event(&conn, Some(agent), "supervisor.child_added", Some(&format!("supervisor={}", supervisor)))?;
    success(&format!("Added '{}' to supervisor '{}'", agent.bright_green(), supervisor));
    Ok(())
}

pub async fn start(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let sv = sup::get_supervisor(&conn, name)?;
    sup::set_supervisor_status(&conn, name, "running")?;
    audit::log_event(&conn, None, "supervisor.started", Some(&format!("name={} children={}", name, sv.children.len())))?;
    success(&format!("Supervisor '{}' started with {} children", name.bright_green(), sv.children.len()));
    Ok(())
}

pub async fn stop(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    sup::set_supervisor_status(&conn, name, "stopped")?;
    audit::log_event(&conn, None, "supervisor.stopped", Some(&format!("name={}", name)))?;
    success(&format!("Supervisor '{}' stopped", name.yellow()));
    Ok(())
}

pub async fn status(name: Option<&str>) -> Result<()> {
    let conn = open_project_db()?;
    if let Some(n) = name {
        let sv = sup::get_supervisor(&conn, n)?;
        println!("  Supervisor: {}", sv.name.bright_cyan());
        println!("  Strategy:   {}", sv.strategy);
        println!("  Status:     {}", sv.status);
        println!("  Children:   {}", sv.children.join(", "));
    } else {
        let svs = sup::list_supervisors(&conn)?;
        if svs.is_empty() {
            println!("  No supervisors found.");
        }
        for sv in svs {
            println!("  {} ({}) — {} — children: {}", sv.name.bright_cyan(), sv.strategy, sv.status, sv.children.join(", "));
        }
    }
    Ok(())
}
