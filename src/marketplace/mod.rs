use crate::error::Result;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub version: String,
    pub source: String,
    pub wasm_path: Option<String>,
    pub description: Option<String>,
    pub installed_at: String,
}

/// Install a skill from the marketplace registry.
pub fn install_skill(conn: &Connection, name: &str) -> Result<Skill> {
    // In production this would fetch from the registry API.
    // For now, create a local record.
    let skill = Skill {
        name: name.to_string(),
        version: "0.1.0".to_string(),
        source: format!("registry://skills/{}", name),
        wasm_path: None,
        description: Some(format!("Skill: {}", name)),
        installed_at: chrono::Utc::now().to_rfc3339(),
    };

    conn.execute(
        "INSERT OR REPLACE INTO skills (name, version, source, wasm_path, description) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![skill.name, skill.version, skill.source, skill.wasm_path, skill.description],
    )?;

    Ok(skill)
}

/// List installed skills.
pub fn list_skills(conn: &Connection) -> Result<Vec<Skill>> {
    let mut stmt = conn.prepare(
        "SELECT name, version, source, wasm_path, description, installed_at FROM skills ORDER BY name",
    )?;
    let skills = stmt
        .query_map([], |row| {
            Ok(Skill {
                name: row.get(0)?,
                version: row.get(1)?,
                source: row.get(2)?,
                wasm_path: row.get(3)?,
                description: row.get(4)?,
                installed_at: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(skills)
}

/// Search for skills (simulated registry search).
pub fn search_skills(_query: &str) -> Result<Vec<SkillListing>> {
    // Simulated marketplace results
    Ok(vec![
        SkillListing { name: "web-scraper".into(), version: "1.2.0".into(), description: "Headless browser web scraping".into(), downloads: 12_450 },
        SkillListing { name: "pdf-reader".into(), version: "0.8.1".into(), description: "Extract text and tables from PDFs".into(), downloads: 8_320 },
        SkillListing { name: "sql-query".into(), version: "2.0.0".into(), description: "Execute SQL queries against databases".into(), downloads: 15_780 },
        SkillListing { name: "email-sender".into(), version: "1.0.3".into(), description: "Send emails via SMTP".into(), downloads: 6_100 },
        SkillListing { name: "image-gen".into(), version: "0.5.0".into(), description: "Generate images from text prompts".into(), downloads: 22_100 },
    ])
}

#[derive(Debug, Serialize)]
pub struct SkillListing {
    pub name: String,
    pub version: String,
    pub description: String,
    pub downloads: u64,
}
