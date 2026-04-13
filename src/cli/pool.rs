use crate::audit;
use crate::error::Result;
use crate::pool as p;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn create(name: &str, strategy: &str) -> Result<()> {
    let conn = open_project_db()?;
    p::create_pool(&conn, name, strategy)?;
    audit::log_event(&conn, None, "pool.created", Some(&format!("name={} strategy={}", name, strategy)))?;
    success(&format!("Pool '{}' created (strategy: {})", name.bright_cyan(), strategy));
    Ok(())
}

pub async fn add(pool: &str, agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    p::add_member(&conn, pool, agent)?;
    success(&format!("Added '{}' to pool '{}'", agent.bright_green(), pool));
    Ok(())
}

pub async fn start(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    p::set_pool_status(&conn, name, "running")?;
    audit::log_event(&conn, None, "pool.started", Some(&format!("name={}", name)))?;
    success(&format!("Pool '{}' started", name.bright_green()));
    Ok(())
}

pub async fn status(name: Option<&str>) -> Result<()> {
    let conn = open_project_db()?;
    if let Some(n) = name {
        let pool = p::get_pool(&conn, n)?;
        println!("  Pool:     {}", pool.name.bright_cyan());
        println!("  Strategy: {}", pool.strategy);
        println!("  Status:   {}", pool.status);
        println!("  Members:  {}", pool.members.join(", "));
    } else {
        let pools = p::list_pools(&conn)?;
        if pools.is_empty() { println!("  No pools found."); }
        for pool in pools {
            println!("  {} ({}) — {} — members: {}", pool.name.bright_cyan(), pool.strategy, pool.status, pool.members.len());
        }
    }
    Ok(())
}
