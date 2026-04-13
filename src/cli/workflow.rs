use crate::audit;
use crate::error::Result;
use crate::workflow as wf;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn create(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    wf::create_workflow(&conn, name)?;
    audit::log_event(&conn, None, "workflow.created", Some(&format!("name={}", name)))?;
    success(&format!("Workflow '{}' created", name.bright_cyan()));
    Ok(())
}

pub async fn run_workflow(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let workflow = wf::get_workflow(&conn, name)?;
    wf::set_workflow_status(&conn, name, "running")?;
    audit::log_event(&conn, None, "workflow.started", Some(&format!("name={} steps={}", name, workflow.steps.len())))?;

    for step in &workflow.steps {
        println!("  Step {}: {} — {}", step.step_index, step.name.bright_cyan(), step.command);
    }

    wf::set_workflow_status(&conn, name, "completed")?;
    success(&format!("Workflow '{}' completed ({} steps)", name.bright_green(), workflow.steps.len()));
    Ok(())
}

pub async fn status(name: Option<&str>) -> Result<()> {
    let conn = open_project_db()?;
    if let Some(n) = name {
        let w = wf::get_workflow(&conn, n)?;
        println!("  Workflow: {}", w.name.bright_cyan());
        println!("  Status:   {}", w.status);
        println!("  Steps:    {}", w.steps.len());
    } else {
        let ws = wf::list_workflows(&conn)?;
        if ws.is_empty() { println!("  No workflows found."); }
        for w in ws {
            println!("  {} — {} ({} steps)", w.name.bright_cyan(), w.status, w.steps.len());
        }
    }
    Ok(())
}
