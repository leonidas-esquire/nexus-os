use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pool {
    pub id: String,
    pub name: String,
    pub strategy: String,
    pub status: String,
    pub members: Vec<String>,
    pub created_at: String,
}

pub fn create_pool(conn: &Connection, name: &str, strategy: &str) -> Result<Pool> {
    let id = Uuid::new_v4().to_string()[..12].to_string();
    conn.execute(
        "INSERT INTO pools (id, name, strategy) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, name, strategy],
    )?;
    Ok(Pool { id, name: name.to_string(), strategy: strategy.to_string(), status: "stopped".to_string(), members: vec![], created_at: chrono::Utc::now().to_rfc3339() })
}

pub fn add_member(conn: &Connection, pool_name: &str, agent_name: &str) -> Result<()> {
    let pool_id: String = conn
        .query_row("SELECT id FROM pools WHERE name = ?1", [pool_name], |row| row.get(0))
        .map_err(|_| NexusError::Pool(format!("Pool '{}' not found", pool_name)))?;
    conn.execute(
        "INSERT INTO pool_members (pool_id, agent_name) VALUES (?1, ?2)",
        rusqlite::params![pool_id, agent_name],
    )?;
    Ok(())
}

pub fn get_pool(conn: &Connection, name: &str) -> Result<Pool> {
    let (id, strategy, status, created_at): (String, String, String, String) = conn
        .query_row(
            "SELECT id, strategy, status, created_at FROM pools WHERE name = ?1",
            [name],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .map_err(|_| NexusError::Pool(format!("Pool '{}' not found", name)))?;

    let mut stmt = conn.prepare("SELECT agent_name FROM pool_members WHERE pool_id = ?1")?;
    let members: Vec<String> = stmt.query_map([&id], |row| row.get(0))?.collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(Pool { id, name: name.to_string(), strategy, status, members, created_at })
}

pub fn list_pools(conn: &Connection) -> Result<Vec<Pool>> {
    let mut stmt = conn.prepare("SELECT name FROM pools ORDER BY name")?;
    let names: Vec<String> = stmt.query_map([], |row| row.get(0))?.collect::<std::result::Result<Vec<_>, _>>()?;
    let mut result = Vec::new();
    for n in names { result.push(get_pool(conn, &n)?); }
    Ok(result)
}

pub fn set_pool_status(conn: &Connection, name: &str, status: &str) -> Result<()> {
    conn.execute("UPDATE pools SET status = ?1 WHERE name = ?2", rusqlite::params![status, name])?;
    Ok(())
}
