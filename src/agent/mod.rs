use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Runtime representation of an agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub template: Option<String>,
    pub source: Option<String>,
    pub status: AgentStatus,
    pub pid: Option<u32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Running,
    Stopped,
    Crashed,
    Paused,
}

impl std::fmt::Display for AgentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Running => write!(f, "running"),
            Self::Stopped => write!(f, "stopped"),
            Self::Crashed => write!(f, "crashed"),
            Self::Paused => write!(f, "paused"),
        }
    }
}

impl std::str::FromStr for AgentStatus {
    type Err = NexusError;
    fn from_str(s: &str) -> Result<Self> {
        match s {
            "running" => Ok(Self::Running),
            "stopped" => Ok(Self::Stopped),
            "crashed" => Ok(Self::Crashed),
            "paused" => Ok(Self::Paused),
            _ => Err(NexusError::Agent(format!("Unknown status: {}", s))),
        }
    }
}

/// Create a new agent record in the database.
pub fn create_agent(conn: &Connection, name: &str, template: Option<&str>, source: Option<&str>) -> Result<Agent> {
    let id = Uuid::new_v4().to_string()[..12].to_string();
    conn.execute(
        "INSERT INTO agents (id, name, template, source, status) VALUES (?1, ?2, ?3, ?4, 'stopped')",
        rusqlite::params![id, name, template, source],
    )?;

    get_agent(conn, name)
}

/// Retrieve an agent by name.
pub fn get_agent(conn: &Connection, name: &str) -> Result<Agent> {
    conn.query_row(
        "SELECT id, name, template, source, status, pid, created_at, updated_at FROM agents WHERE name = ?1",
        [name],
        |row| {
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                template: row.get(2)?,
                source: row.get(3)?,
                status: row.get::<_, String>(4)?
                    .parse()
                    .unwrap_or(AgentStatus::Stopped),
                pid: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )
    .map_err(|e| NexusError::Agent(format!("Agent '{}' not found: {}", name, e)))
}

/// List all agents.
pub fn list_agents(conn: &Connection) -> Result<Vec<Agent>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, template, source, status, pid, created_at, updated_at FROM agents ORDER BY name",
    )?;
    let agents = stmt
        .query_map([], |row| {
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                template: row.get(2)?,
                source: row.get(3)?,
                status: row.get::<_, String>(4)?
                    .parse()
                    .unwrap_or(AgentStatus::Stopped),
                pid: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(agents)
}

/// Update agent status.
pub fn set_agent_status(conn: &Connection, name: &str, status: AgentStatus, pid: Option<u32>) -> Result<()> {
    let rows = conn.execute(
        "UPDATE agents SET status = ?1, pid = ?2, updated_at = datetime('now') WHERE name = ?3",
        rusqlite::params![status.to_string(), pid, name],
    )?;
    if rows == 0 {
        return Err(NexusError::Agent(format!("Agent '{}' not found", name)));
    }
    Ok(())
}

/// Delete an agent.
pub fn delete_agent(conn: &Connection, name: &str) -> Result<()> {
    let rows = conn.execute("DELETE FROM agents WHERE name = ?1", [name])?;
    if rows == 0 {
        return Err(NexusError::Agent(format!("Agent '{}' not found", name)));
    }
    Ok(())
}

/// Available agent templates.
pub const TEMPLATES: &[&str] = &["echo", "http", "cron", "pipeline", "research", "coding", "data", "custom"];

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use tempfile::TempDir;

    fn setup() -> (TempDir, Connection) {
        let tmp = TempDir::new().unwrap();
        let conn = db::open_db(tmp.path()).unwrap();
        db::migrate(&conn).unwrap();
        (tmp, conn)
    }

    #[test]
    fn test_create_and_get_agent() {
        let (_tmp, conn) = setup();
        let agent = create_agent(&conn, "test-agent", Some("echo"), None).unwrap();
        assert_eq!(agent.name, "test-agent");
        assert_eq!(agent.template.as_deref(), Some("echo"));
        assert_eq!(agent.status, AgentStatus::Stopped);
    }

    #[test]
    fn test_list_agents() {
        let (_tmp, conn) = setup();
        create_agent(&conn, "alpha", None, None).unwrap();
        create_agent(&conn, "beta", None, None).unwrap();
        let agents = list_agents(&conn).unwrap();
        assert_eq!(agents.len(), 2);
    }

    #[test]
    fn test_set_status() {
        let (_tmp, conn) = setup();
        create_agent(&conn, "runner", None, None).unwrap();
        set_agent_status(&conn, "runner", AgentStatus::Running, Some(1234)).unwrap();
        let agent = get_agent(&conn, "runner").unwrap();
        assert_eq!(agent.status, AgentStatus::Running);
        assert_eq!(agent.pid, Some(1234));
    }

    #[test]
    fn test_delete_agent() {
        let (_tmp, conn) = setup();
        create_agent(&conn, "doomed", None, None).unwrap();
        delete_agent(&conn, "doomed").unwrap();
        assert!(get_agent(&conn, "doomed").is_err());
    }
}
