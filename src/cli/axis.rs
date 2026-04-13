use crate::audit;
use crate::error::Result;
use crate::trust;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn register(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    let record = trust::register_agent(&conn, agent)?;
    audit::log_event(&conn, Some(agent), "axis.registered", record.auid.as_deref())?;
    success(&format!("Registered '{}' with AXIS Trust", agent.bright_cyan()));
    if let Some(auid) = &record.auid {
        println!("  AUID:       {}", auid.bright_green());
    }
    println!("  Trust Tier: {}", record.trust_tier.unwrap_or_default());
    println!("  T-Score:    {}", record.t_score.unwrap_or(0));
    Ok(())
}

pub async fn status(agent: &str) -> Result<()> {
    let conn = open_project_db()?;
    let record = trust::get_trust(&conn, agent)?;
    println!("  Agent:      {}", record.agent_name.bright_cyan());
    println!("  AUID:       {}", record.auid.unwrap_or_else(|| "—".to_string()));
    println!("  Trust Tier: {}", record.trust_tier.unwrap_or_else(|| "unverified".to_string()));
    println!("  T-Score:    {}", record.t_score.unwrap_or(0));
    println!("  Status:     {}", record.status);
    if let Some(v) = &record.verified_at {
        println!("  Verified:   {}", v);
    }
    Ok(())
}

pub async fn verify(auid: &str) -> Result<()> {
    let conn = open_project_db()?;
    let record = trust::verify_auid(&conn, auid)?;
    audit::log_event(&conn, Some(&record.agent_name), "axis.verified", Some(auid))?;
    success(&format!("AUID {} verified", auid.bright_green()));
    println!("  Agent:      {}", record.agent_name);
    println!("  Trust Tier: {}", record.trust_tier.unwrap_or_default());
    println!("  T-Score:    {}", record.t_score.unwrap_or(0));
    Ok(())
}
