use super::{open_project_db, success};
use crate::agent;
use crate::error::Result;
use colored::Colorize;

pub async fn run(name: &str, template: &str, source: Option<&str>) -> Result<()> {
    if !agent::TEMPLATES.contains(&template) {
        return Err(crate::NexusError::Agent(format!(
            "Unknown template '{}'. Available: {}",
            template,
            agent::TEMPLATES.join(", ")
        )));
    }

    let conn = open_project_db()?;
    let source = source
        .map(|source| -> Result<String> {
            let path = std::fs::canonicalize(source)?;
            crate::wasm::validate_wasm(&path)?;
            let root = super::project_root()?;
            Ok(path
                .strip_prefix(&root)
                .unwrap_or(&path)
                .to_string_lossy()
                .into_owned())
        })
        .transpose()?;
    let agent = agent::create_agent(&conn, name, Some(template), source.as_deref())?;

    success(&format!("Agent ID: {}", agent.id.bright_blue()));

    Ok(())
}
