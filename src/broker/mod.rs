use crate::error::Result;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteDecision {
    pub task: String,
    pub handler: String,
    pub handler_type: HandlerType,
    pub confidence: f64,
    pub estimated_cost_cents: u32,
    pub estimated_latency_ms: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HandlerType {
    Skill,
    Wasm,
    Llm,
}

impl std::fmt::Display for HandlerType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Skill => write!(f, "skill"),
            Self::Wasm => write!(f, "wasm"),
            Self::Llm => write!(f, "llm"),
        }
    }
}

/// Evaluate a task and determine the cheapest capable handler.
/// Routing cascade: Skill → WASM → LLM.
pub fn route_task(conn: &Connection, task: &str) -> Result<RouteDecision> {
    // Check if any installed skill matches the task pattern
    let skill_match: Option<String> = conn
        .query_row(
            "SELECT name FROM skills WHERE ?1 LIKE '%' || name || '%' LIMIT 1",
            [task],
            |row| row.get(0),
        )
        .ok();

    if let Some(skill_name) = skill_match {
        return Ok(RouteDecision {
            task: task.to_string(),
            handler: skill_name,
            handler_type: HandlerType::Skill,
            confidence: 0.95,
            estimated_cost_cents: 0,
            estimated_latency_ms: 5,
        });
    }

    // Check for WASM modules that could handle the task
    let wasm_match: Option<String> = conn
        .query_row(
            "SELECT name FROM skills WHERE wasm_path IS NOT NULL LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    if let Some(wasm_name) = wasm_match {
        return Ok(RouteDecision {
            task: task.to_string(),
            handler: wasm_name,
            handler_type: HandlerType::Wasm,
            confidence: 0.85,
            estimated_cost_cents: 0,
            estimated_latency_ms: 10,
        });
    }

    // Fallback to LLM
    Ok(RouteDecision {
        task: task.to_string(),
        handler: "gpt-4o-mini".to_string(),
        handler_type: HandlerType::Llm,
        confidence: 0.75,
        estimated_cost_cents: 1,
        estimated_latency_ms: 1000,
    })
}

/// Record a routing event.
pub fn record_route(conn: &Connection, decision: &RouteDecision) -> Result<()> {
    conn.execute(
        "INSERT INTO broker_routes (task, handler, handler_type, cost_cents, latency_ms) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            decision.task,
            decision.handler,
            decision.handler_type.to_string(),
            decision.estimated_cost_cents,
            decision.estimated_latency_ms,
        ],
    )?;
    Ok(())
}

/// Get routing statistics.
pub fn get_stats(conn: &Connection) -> Result<BrokerStats> {
    let total: i64 = conn.query_row("SELECT COUNT(*) FROM broker_routes", [], |r| r.get(0))?;
    let skill_count: i64 = conn.query_row("SELECT COUNT(*) FROM broker_routes WHERE handler_type = 'skill'", [], |r| r.get(0))?;
    let wasm_count: i64 = conn.query_row("SELECT COUNT(*) FROM broker_routes WHERE handler_type = 'wasm'", [], |r| r.get(0))?;
    let llm_count: i64 = conn.query_row("SELECT COUNT(*) FROM broker_routes WHERE handler_type = 'llm'", [], |r| r.get(0))?;
    let total_cost: i64 = conn.query_row("SELECT COALESCE(SUM(cost_cents), 0) FROM broker_routes", [], |r| r.get(0))?;

    Ok(BrokerStats { total_routes: total, skill_routes: skill_count, wasm_routes: wasm_count, llm_routes: llm_count, total_cost_cents: total_cost })
}

#[derive(Debug, Serialize)]
pub struct BrokerStats {
    pub total_routes: i64,
    pub skill_routes: i64,
    pub wasm_routes: i64,
    pub llm_routes: i64,
    pub total_cost_cents: i64,
}
