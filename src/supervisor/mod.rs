use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Supervisor {
    pub id: String,
    pub name: String,
    pub strategy: Strategy,
    pub max_restarts: u32,
    pub restart_window: u64,
    pub status: String,
    pub children: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Strategy {
    OneForOne,
    OneForAll,
    RestForOne,
}

impl std::fmt::Display for Strategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::OneForOne => write!(f, "one-for-one"),
            Self::OneForAll => write!(f, "one-for-all"),
            Self::RestForOne => write!(f, "rest-for-one"),
        }
    }
}

impl std::str::FromStr for Strategy {
    type Err = NexusError;
    fn from_str(s: &str) -> Result<Self> {
        match s {
            "one-for-one" => Ok(Self::OneForOne),
            "one-for-all" => Ok(Self::OneForAll),
            "rest-for-one" => Ok(Self::RestForOne),
            _ => Err(NexusError::Supervisor(format!(
                "Unknown strategy '{}'. Use: one-for-one, one-for-all, rest-for-one",
                s
            ))),
        }
    }
}

pub fn create_supervisor(
    conn: &Connection,
    name: &str,
    strategy: &str,
    max_restarts: u32,
) -> Result<Supervisor> {
    let id = Uuid::new_v4().to_string()[..12].to_string();
    let strat: Strategy = strategy.parse()?;

    conn.execute(
        "INSERT INTO supervisors (id, name, strategy, max_restarts) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![id, name, strat.to_string(), max_restarts],
    )?;

    Ok(Supervisor {
        id,
        name: name.to_string(),
        strategy: strat,
        max_restarts,
        restart_window: 60,
        status: "stopped".to_string(),
        children: vec![],
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn add_child(conn: &Connection, supervisor_name: &str, agent_name: &str) -> Result<()> {
    let sup_id: String = conn
        .query_row(
            "SELECT id FROM supervisors WHERE name = ?1",
            [supervisor_name],
            |row| row.get(0),
        )
        .map_err(|_| {
            NexusError::Supervisor(format!("Supervisor '{}' not found", supervisor_name))
        })?;

    let pos: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM supervisor_children WHERE supervisor_id = ?1",
            [&sup_id],
            |row| row.get(0),
        )?;

    conn.execute(
        "INSERT INTO supervisor_children (supervisor_id, agent_name, position) VALUES (?1, ?2, ?3)",
        rusqlite::params![sup_id, agent_name, pos],
    )?;

    Ok(())
}

pub fn get_supervisor(conn: &Connection, name: &str) -> Result<Supervisor> {
    let (id, strategy_str, max_restarts, restart_window, status, created_at): (
        String, String, u32, u64, String, String,
    ) = conn
        .query_row(
            "SELECT id, strategy, max_restarts, restart_window, status, created_at FROM supervisors WHERE name = ?1",
            [name],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?)),
        )
        .map_err(|_| NexusError::Supervisor(format!("Supervisor '{}' not found", name)))?;

    let mut stmt = conn.prepare(
        "SELECT agent_name FROM supervisor_children WHERE supervisor_id = ?1 ORDER BY position",
    )?;
    let children: Vec<String> = stmt
        .query_map([&id], |row| row.get(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    Ok(Supervisor {
        id,
        name: name.to_string(),
        strategy: strategy_str.parse()?,
        max_restarts,
        restart_window,
        status,
        children,
        created_at,
    })
}

pub fn list_supervisors(conn: &Connection) -> Result<Vec<Supervisor>> {
    let mut stmt = conn.prepare("SELECT name FROM supervisors ORDER BY name")?;
    let names: Vec<String> = stmt
        .query_map([], |row| row.get(0))?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    let mut result = Vec::new();
    for name in names {
        result.push(get_supervisor(conn, &name)?);
    }
    Ok(result)
}

pub fn set_supervisor_status(conn: &Connection, name: &str, status: &str) -> Result<()> {
    let rows = conn.execute(
        "UPDATE supervisors SET status = ?1 WHERE name = ?2",
        rusqlite::params![status, name],
    )?;
    if rows == 0 {
        return Err(NexusError::Supervisor(format!(
            "Supervisor '{}' not found",
            name
        )));
    }
    Ok(())
}
