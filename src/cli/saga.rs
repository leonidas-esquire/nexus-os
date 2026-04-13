use crate::audit;
use crate::error::Result;
use crate::saga as s;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn create(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    s::create_saga(&conn, name)?;
    audit::log_event(&conn, None, "saga.created", Some(&format!("name={}", name)))?;
    success(&format!("Saga '{}' created", name.bright_cyan()));
    Ok(())
}

pub async fn run_saga(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let saga = s::get_saga(&conn, name)?;

    if saga.steps.is_empty() {
        println!("  Saga '{}' has no steps defined.", name);
        return Ok(());
    }

    s::set_saga_status(&conn, name, "running", 0)?;
    audit::log_event(&conn, None, "saga.started", Some(&format!("name={} steps={}", name, saga.steps.len())))?;

    for step in &saga.steps {
        println!("  Step {}: {} — {}", step.step_index, step.name.bright_cyan(), step.action);
    }

    s::set_saga_status(&conn, name, "completed", saga.steps.len() as i32)?;
    success(&format!("Saga '{}' completed ({} steps)", name.bright_green(), saga.steps.len()));
    Ok(())
}

pub async fn status(name: Option<&str>) -> Result<()> {
    let conn = open_project_db()?;
    if let Some(n) = name {
        let saga = s::get_saga(&conn, n)?;
        println!("  Saga:   {}", saga.name.bright_cyan());
        println!("  Status: {}", saga.status);
        println!("  Steps:  {}", saga.steps.len());
        for step in &saga.steps {
            let marker = match step.status.as_str() {
                "completed" => "✓".green().to_string(),
                "failed" => "✕".red().to_string(),
                _ => "○".dimmed().to_string(),
            };
            println!("    {} {} — {}", marker, step.name, step.action);
        }
    } else {
        let sagas = s::list_sagas(&conn)?;
        if sagas.is_empty() {
            println!("  No sagas found.");
        }
        for saga in sagas {
            println!("  {} — {} ({} steps)", saga.name.bright_cyan(), saga.status, saga.steps.len());
        }
    }
    Ok(())
}
