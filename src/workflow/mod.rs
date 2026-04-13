use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub status: String,
    pub steps: Vec<WorkflowStep>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStep {
    pub step_index: i32,
    pub name: String,
    pub command: String,
    pub status: String,
    pub output: Option<String>,
}

pub fn create_workflow(conn: &Connection, name: &str) -> Result<Workflow> {
    let id = Uuid::new_v4().to_string()[..12].to_string();
    conn.execute(
        "INSERT INTO workflows (id, name) VALUES (?1, ?2)",
        rusqlite::params![id, name],
    )?;
    Ok(Workflow {
        id,
        name: name.to_string(),
        status: "pending".to_string(),
        steps: vec![],
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn get_workflow(conn: &Connection, name: &str) -> Result<Workflow> {
    let (id, status, created_at): (String, String, String) = conn
        .query_row(
            "SELECT id, status, created_at FROM workflows WHERE name = ?1",
            [name],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|_| NexusError::Workflow(format!("Workflow '{}' not found", name)))?;

    let mut stmt = conn.prepare(
        "SELECT step_index, name, command, status, output FROM workflow_steps WHERE workflow_id = ?1 ORDER BY step_index",
    )?;
    let steps: Vec<WorkflowStep> = stmt
        .query_map([&id], |row| {
            Ok(WorkflowStep {
                step_index: row.get(0)?,
                name: row.get(1)?,
                command: row.get(2)?,
                status: row.get(3)?,
                output: row.get(4)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(Workflow { id, name: name.to_string(), status, steps, created_at })
}

pub fn list_workflows(conn: &Connection) -> Result<Vec<Workflow>> {
    let mut stmt = conn.prepare("SELECT name FROM workflows ORDER BY name")?;
    let names: Vec<String> = stmt.query_map([], |row| row.get(0))?.collect::<std::result::Result<Vec<_>, _>>()?;
    let mut result = Vec::new();
    for n in names { result.push(get_workflow(conn, &n)?); }
    Ok(result)
}

pub fn set_workflow_status(conn: &Connection, name: &str, status: &str) -> Result<()> {
    conn.execute(
        "UPDATE workflows SET status = ?1, updated_at = datetime('now') WHERE name = ?2",
        rusqlite::params![status, name],
    )?;
    Ok(())
}
