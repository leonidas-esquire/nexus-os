use crate::config;
use crate::db;
use crate::error::Result;
use super::success;
use std::path::Path;

pub async fn run(name: &str) -> Result<()> {
    let project_dir = Path::new(name);

    if project_dir.exists() {
        return Err(crate::NexusError::Config(format!(
            "Directory '{}' already exists",
            name
        )));
    }

    // Create project structure
    std::fs::create_dir_all(project_dir.join("agents"))?;
    std::fs::create_dir_all(project_dir.join("skills"))?;
    std::fs::create_dir_all(project_dir.join("data"))?;

    success("Created project structure");

    // Generate config
    config::write_default_config(project_dir, name)?;
    success("Generated nexus.config.yaml");

    // Initialize database
    let conn = db::open_db(project_dir)?;
    db::migrate(&conn)?;
    success("Initialized SQLite database");

    // Create example agent
    let example = project_dir.join("agents").join("example.yaml");
    std::fs::write(
        &example,
        r#"# Example agent definition
name: example
template: echo
description: A simple echo agent for testing
"#,
    )?;
    success("Created example agent");

    println!();
    println!(
        "  Project '{}' created. Run:\n\n    cd {}\n    naos create my-agent\n    naos run my-agent\n",
        name, name
    );

    Ok(())
}
