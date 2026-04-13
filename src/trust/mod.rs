use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustRecord {
    pub agent_name: String,
    pub auid: Option<String>,
    pub trust_tier: Option<String>,
    pub t_score: Option<i32>,
    pub credit_rating: Option<String>,
    pub verified_at: Option<String>,
    pub status: String,
}

/// Trust tiers as defined by AXIS.
pub const TRUST_TIERS: &[&str] = &["unverified", "basic", "standard", "verified", "certified"];

/// Generate an AXIS Unique Identifier for an agent.
pub fn generate_auid(agent_name: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(agent_name.as_bytes());
    hasher.update(chrono::Utc::now().to_rfc3339().as_bytes());
    let hash = hex::encode(hasher.finalize());
    format!("AXIS-{}", &hash[..16].to_uppercase())
}

/// Register an agent with the AXIS Trust system.
pub fn register_agent(conn: &Connection, agent_name: &str) -> Result<TrustRecord> {
    let auid = generate_auid(agent_name);

    conn.execute(
        "INSERT OR REPLACE INTO trust_records (agent_name, auid, trust_tier, t_score, status) VALUES (?1, ?2, 'basic', 50, 'registered')",
        rusqlite::params![agent_name, auid],
    )?;

    Ok(TrustRecord {
        agent_name: agent_name.to_string(),
        auid: Some(auid),
        trust_tier: Some("basic".to_string()),
        t_score: Some(50),
        credit_rating: None,
        verified_at: None,
        status: "registered".to_string(),
    })
}

/// Get trust status for an agent.
pub fn get_trust(conn: &Connection, agent_name: &str) -> Result<TrustRecord> {
    conn.query_row(
        "SELECT agent_name, auid, trust_tier, t_score, credit_rating, verified_at, status FROM trust_records WHERE agent_name = ?1",
        [agent_name],
        |row| {
            Ok(TrustRecord {
                agent_name: row.get(0)?,
                auid: row.get(1)?,
                trust_tier: row.get(2)?,
                t_score: row.get(3)?,
                credit_rating: row.get(4)?,
                verified_at: row.get(5)?,
                status: row.get(6)?,
            })
        },
    )
    .map_err(|_| NexusError::Trust(format!("No trust record for agent '{}'", agent_name)))
}

/// Verify an agent by AUID (simulated external verification).
pub fn verify_auid(conn: &Connection, auid: &str) -> Result<TrustRecord> {
    let record: TrustRecord = conn
        .query_row(
            "SELECT agent_name, auid, trust_tier, t_score, credit_rating, verified_at, status FROM trust_records WHERE auid = ?1",
            [auid],
            |row| {
                Ok(TrustRecord {
                    agent_name: row.get(0)?,
                    auid: row.get(1)?,
                    trust_tier: row.get(2)?,
                    t_score: row.get(3)?,
                    credit_rating: row.get(4)?,
                    verified_at: row.get(5)?,
                    status: row.get(6)?,
                })
            },
        )
        .map_err(|_| NexusError::Trust(format!("AUID '{}' not found", auid)))?;

    conn.execute(
        "UPDATE trust_records SET status = 'verified', trust_tier = 'verified', t_score = 85, verified_at = datetime('now') WHERE auid = ?1",
        [auid],
    )?;

    Ok(TrustRecord {
        status: "verified".to_string(),
        trust_tier: Some("verified".to_string()),
        t_score: Some(85),
        verified_at: Some(chrono::Utc::now().to_rfc3339()),
        ..record
    })
}
