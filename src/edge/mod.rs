use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdgeDeployment {
    pub agent_name: String,
    pub worker_name: String,
    pub region: Option<String>,
    pub status: String,
    pub url: Option<String>,
    pub deployed_at: String,
}

pub fn deploy(conn: &Connection, agent_name: &str) -> Result<EdgeDeployment> {
    let worker_name = format!("naos-{}", agent_name);
    let url = format!("https://{}.nexus-os.workers.dev", worker_name);

    conn.execute(
        "INSERT OR REPLACE INTO edge_deployments (agent_name, worker_name, region, status, url) VALUES (?1, ?2, 'global', 'deployed', ?3)",
        rusqlite::params![agent_name, worker_name, url],
    )?;

    Ok(EdgeDeployment {
        agent_name: agent_name.to_string(),
        worker_name,
        region: Some("global".to_string()),
        status: "deployed".to_string(),
        url: Some(url),
        deployed_at: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn get_deployment(conn: &Connection, agent_name: &str) -> Result<EdgeDeployment> {
    conn.query_row(
        "SELECT agent_name, worker_name, region, status, url, deployed_at FROM edge_deployments WHERE agent_name = ?1",
        [agent_name],
        |row| {
            Ok(EdgeDeployment {
                agent_name: row.get(0)?,
                worker_name: row.get(1)?,
                region: row.get(2)?,
                status: row.get(3)?,
                url: row.get(4)?,
                deployed_at: row.get(5)?,
            })
        },
    )
    .map_err(|_| NexusError::Edge(format!("No deployment found for agent '{}'", agent_name)))
}

pub fn list_deployments(conn: &Connection) -> Result<Vec<EdgeDeployment>> {
    let mut stmt = conn.prepare(
        "SELECT agent_name, worker_name, region, status, url, deployed_at FROM edge_deployments ORDER BY agent_name",
    )?;
    let deps = stmt
        .query_map([], |row| {
            Ok(EdgeDeployment {
                agent_name: row.get(0)?,
                worker_name: row.get(1)?,
                region: row.get(2)?,
                status: row.get(3)?,
                url: row.get(4)?,
                deployed_at: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(deps)
}

pub fn undeploy(conn: &Connection, agent_name: &str) -> Result<()> {
    let rows = conn.execute("DELETE FROM edge_deployments WHERE agent_name = ?1", [agent_name])?;
    if rows == 0 {
        return Err(NexusError::Edge(format!("No deployment found for agent '{}'", agent_name)));
    }
    Ok(())
}
