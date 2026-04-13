use crate::error::Result;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::atomic::{AtomicU64, Ordering};

/// Lamport clock for causal ordering.
static LAMPORT: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: i64,
    pub timestamp: String,
    pub lamport: u64,
    pub agent_name: Option<String>,
    pub event_type: String,
    pub detail: Option<String>,
    pub content_hash: Option<String>,
}

/// Log an event to the causal audit trail.
pub fn log_event(
    conn: &Connection,
    agent_name: Option<&str>,
    event_type: &str,
    detail: Option<&str>,
) -> Result<()> {
    let lamport = LAMPORT.fetch_add(1, Ordering::SeqCst) + 1;

    // Compute content hash for tamper detection
    let hash_input = format!(
        "{}:{}:{}:{}",
        lamport,
        agent_name.unwrap_or(""),
        event_type,
        detail.unwrap_or("")
    );
    let mut hasher = Sha256::new();
    hasher.update(hash_input.as_bytes());
    let content_hash = hex::encode(hasher.finalize());

    conn.execute(
        "INSERT INTO audit_log (lamport, agent_name, event_type, detail, content_hash) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![lamport as i64, agent_name, event_type, detail, content_hash],
    )?;

    Ok(())
}

/// Retrieve the most recent N audit entries.
pub fn tail(conn: &Connection, n: usize) -> Result<Vec<AuditEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, timestamp, lamport, agent_name, event_type, detail, content_hash FROM audit_log ORDER BY id DESC LIMIT ?1",
    )?;
    let entries: Vec<AuditEntry> = stmt
        .query_map([n as i64], |row| {
            Ok(AuditEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                lamport: row.get::<_, i64>(2)? as u64,
                agent_name: row.get(3)?,
                event_type: row.get(4)?,
                detail: row.get(5)?,
                content_hash: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;

    // Return in chronological order
    let mut sorted = entries;
    sorted.reverse();
    Ok(sorted)
}

/// Search audit entries by event type or detail.
pub fn search(conn: &Connection, query: &str) -> Result<Vec<AuditEntry>> {
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, timestamp, lamport, agent_name, event_type, detail, content_hash FROM audit_log WHERE event_type LIKE ?1 OR detail LIKE ?1 OR agent_name LIKE ?1 ORDER BY id DESC LIMIT 100",
    )?;
    let entries: Vec<AuditEntry> = stmt
        .query_map([&pattern], |row| {
            Ok(AuditEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                lamport: row.get::<_, i64>(2)? as u64,
                agent_name: row.get(3)?,
                event_type: row.get(4)?,
                detail: row.get(5)?,
                content_hash: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(entries)
}
