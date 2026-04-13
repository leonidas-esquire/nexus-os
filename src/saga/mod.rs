use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Saga {
    pub id: String,
    pub name: String,
    pub status: String,
    pub current_step: i32,
    pub steps: Vec<SagaStep>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SagaStep {
    pub step_index: i32,
    pub name: String,
    pub action: String,
    pub compensate: Option<String>,
    pub status: String,
}

pub fn create_saga(conn: &Connection, name: &str) -> Result<Saga> {
    let id = Uuid::new_v4().to_string()[..12].to_string();
    conn.execute(
        "INSERT INTO sagas (id, name) VALUES (?1, ?2)",
        rusqlite::params![id, name],
    )?;
    Ok(Saga {
        id,
        name: name.to_string(),
        status: "pending".to_string(),
        current_step: 0,
        steps: vec![],
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn add_step(
    conn: &Connection,
    saga_name: &str,
    step_name: &str,
    action: &str,
    compensate: Option<&str>,
) -> Result<()> {
    let saga_id: String = conn
        .query_row("SELECT id FROM sagas WHERE name = ?1", [saga_name], |row| {
            row.get(0)
        })
        .map_err(|_| NexusError::Saga(format!("Saga '{}' not found", saga_name)))?;

    let idx: i32 = conn.query_row(
        "SELECT COALESCE(MAX(step_index), -1) + 1 FROM saga_steps WHERE saga_id = ?1",
        [&saga_id],
        |row| row.get(0),
    )?;

    conn.execute(
        "INSERT INTO saga_steps (saga_id, step_index, name, action, compensate) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![saga_id, idx, step_name, action, compensate],
    )?;
    Ok(())
}

pub fn get_saga(conn: &Connection, name: &str) -> Result<Saga> {
    let (id, status, current_step, created_at): (String, String, i32, String) = conn
        .query_row(
            "SELECT id, status, current_step, created_at FROM sagas WHERE name = ?1",
            [name],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|_| NexusError::Saga(format!("Saga '{}' not found", name)))?;

    let mut stmt = conn.prepare(
        "SELECT step_index, name, action, compensate, status FROM saga_steps WHERE saga_id = ?1 ORDER BY step_index",
    )?;
    let steps: Vec<SagaStep> = stmt
        .query_map([&id], |row| {
            Ok(SagaStep {
                step_index: row.get(0)?,
                name: row.get(1)?,
                action: row.get(2)?,
                compensate: row.get(3)?,
                status: row.get(4)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(Saga {
        id,
        name: name.to_string(),
        status,
        current_step,
        steps,
        created_at,
    })
}

pub fn list_sagas(conn: &Connection) -> Result<Vec<Saga>> {
    let mut stmt = conn.prepare("SELECT name FROM sagas ORDER BY name")?;
    let names: Vec<String> = stmt
        .query_map([], |row| row.get(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    let mut result = Vec::new();
    for n in names {
        result.push(get_saga(conn, &n)?);
    }
    Ok(result)
}

pub fn set_saga_status(conn: &Connection, name: &str, status: &str, step: i32) -> Result<()> {
    conn.execute(
        "UPDATE sagas SET status = ?1, current_step = ?2, updated_at = datetime('now') WHERE name = ?3",
        rusqlite::params![status, step, name],
    )?;
    Ok(())
}
