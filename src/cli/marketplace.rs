use crate::audit;
use crate::error::Result;
use crate::marketplace as mp;
use super::{open_project_db, success, info};
use colored::Colorize;

pub async fn search(query: &str) -> Result<()> {
    let results = mp::search_skills(query)?;
    if results.is_empty() {
        println!("  No skills found matching '{}'.", query);
        return Ok(());
    }
    println!("  {} results for '{}':\n", results.len(), query);
    for skill in results {
        println!(
            "  {} {} — {} ({} downloads)",
            skill.name.bright_cyan(),
            format!("v{}", skill.version).dimmed(),
            skill.description,
            skill.downloads
        );
    }
    Ok(())
}

pub async fn install(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let skill = mp::install_skill(&conn, name)?;
    audit::log_event(&conn, None, "marketplace.installed", Some(&format!("skill={} version={}", name, skill.version)))?;
    success(&format!("Installed skill '{}' v{}", name.bright_green(), skill.version));
    Ok(())
}

pub async fn list() -> Result<()> {
    let conn = open_project_db()?;
    let skills = mp::list_skills(&conn)?;
    if skills.is_empty() {
        println!("  No skills installed. Use `naos marketplace install <name>`.");
        return Ok(());
    }
    for skill in skills {
        println!(
            "  {} {} — {}",
            skill.name.bright_cyan(),
            format!("v{}", skill.version).dimmed(),
            skill.description.unwrap_or_default()
        );
    }
    Ok(())
}

pub async fn publish(path: &str) -> Result<()> {
    info(&format!("Publishing skill from '{}'...", path));
    info("In production, this would package and upload the skill to the Nexus OS registry.");
    success("Skill published (simulated)");
    Ok(())
}
