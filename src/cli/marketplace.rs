use super::{info, open_project_db, success};
use crate::audit;
use crate::error::Result;
use crate::marketplace as mp;
use colored::Colorize;

pub async fn search(query: &str) -> Result<()> {
    let results = mp::search_skills(query).await?;
    if results.is_empty() {
        println!("  No skills found matching '{}'.", query);
        return Ok(());
    }
    println!("  {} results for '{}':\n", results.len(), query);
    for skill in results {
        println!(
            "  {} {} — {}",
            skill.name.bright_cyan(),
            format!("v{}", skill.version).dimmed(),
            skill.manifest["description"].as_str().unwrap_or("")
        );
    }
    Ok(())
}

pub async fn install(name: &str) -> Result<()> {
    let conn = open_project_db()?;
    let skill = mp::install_skill(&conn, &super::project_root()?, name).await?;
    audit::log_event(
        &conn,
        None,
        "marketplace.installed",
        Some(&format!("skill={} version={}", name, skill.version)),
    )?;
    success(&format!(
        "Installed skill '{}' v{}",
        name.bright_green(),
        skill.version
    ));
    let path = skill.wasm_path.as_deref().unwrap_or_default();
    info(&format!("Package: {}", path));
    info(&format!(
        "Create an agent: naos create {} --source {}",
        skill.name,
        sh_quote(path)
    ));
    Ok(())
}

fn sh_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\"'\"'"))
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
    let release = mp::publish_skill(std::path::Path::new(path)).await?;
    success(&format!(
        "Submitted {}@{} for review (pending)",
        release["name"].as_str().unwrap_or(""),
        release["version"].as_str().unwrap_or("")
    ));
    Ok(())
}
