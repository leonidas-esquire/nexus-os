use crate::audit;
use crate::edge as e;
use crate::error::Result;
use super::{open_project_db, success, info};
use colored::Colorize;

pub async fn login() -> Result<()> {
    info("Cloudflare authentication is configured via wrangler CLI or environment variables.");
    info("Set CLOUDFLARE_API_TOKEN in your environment to authenticate.");
    Ok(())
}

pub async fn deploy(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    let dep = e::deploy(&conn, agent)?;
    audit::log_event(&conn, Some(agent), "edge.deployed", dep.url.as_deref())?;
    success(&format!("Deployed '{}' to Cloudflare Workers", agent.bright_green()));
    if let Some(url) = &dep.url {
        println!("  URL: {}", url.bright_cyan());
    }
    Ok(())
}

pub async fn list() -> Result<()> {
    let conn = open_project_db()?;
    let deps = e::list_deployments(&conn)?;
    if deps.is_empty() {
        println!("  No edge deployments found.");
        return Ok(());
    }
    for dep in deps {
        println!("  {} — {} — {}", dep.agent_name.bright_cyan(), dep.status, dep.url.unwrap_or_default());
    }
    Ok(())
}

pub async fn status(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    let dep = e::get_deployment(&conn, agent)?;
    println!("  Agent:   {}", dep.agent_name.bright_cyan());
    println!("  Worker:  {}", dep.worker_name);
    println!("  Region:  {}", dep.region.unwrap_or_else(|| "global".to_string()));
    println!("  Status:  {}", dep.status);
    println!("  URL:     {}", dep.url.unwrap_or_default());
    Ok(())
}

pub async fn logs(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    let dep = e::get_deployment(&conn, agent)?;
    info(&format!("Streaming logs for worker '{}' (Ctrl+C to stop)...", dep.worker_name));
    info("In production, this would connect to Cloudflare's log stream API.");
    Ok(())
}

pub async fn undeploy(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    e::undeploy(&conn, agent)?;
    audit::log_event(&conn, Some(agent), "edge.undeployed", None)?;
    success(&format!("Removed '{}' from edge", agent.yellow()));
    Ok(())
}
