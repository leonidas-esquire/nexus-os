use crate::error::Result;
use axum::{extract::State, response::Json, routing::get, Router};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Arc;

/// Shared application state for the dashboard server.
pub struct AppState {
    pub project_dir: PathBuf,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[derive(Serialize)]
struct AgentSummary {
    name: String,
    status: String,
    id: String,
}

#[derive(Serialize)]
struct DashboardData {
    agents: Vec<AgentSummary>,
    total_agents: usize,
    running: usize,
    stopped: usize,
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

async fn dashboard_data(State(state): State<Arc<AppState>>) -> Json<DashboardData> {
    let conn = match crate::db::open_db(&state.project_dir) {
        Ok(c) => c,
        Err(_) => {
            return Json(DashboardData {
                agents: vec![],
                total_agents: 0,
                running: 0,
                stopped: 0,
            })
        }
    };

    let agents = crate::agent::list_agents(&conn).unwrap_or_default();
    let running = agents
        .iter()
        .filter(|a| a.status == crate::agent::AgentStatus::Running)
        .count();
    let stopped = agents.len() - running;

    let summaries: Vec<AgentSummary> = agents
        .iter()
        .map(|a| AgentSummary {
            name: a.name.clone(),
            status: a.status.to_string(),
            id: a.id.clone(),
        })
        .collect();

    Json(DashboardData {
        total_agents: summaries.len(),
        running,
        stopped,
        agents: summaries,
    })
}

/// Build the Axum router for the dashboard.
pub fn build_router(project_dir: PathBuf) -> Router {
    let state = Arc::new(AppState { project_dir });

    Router::new()
        .route("/api/health", get(health))
        .route("/api/dashboard", get(dashboard_data))
        .with_state(state)
}

/// Start the dashboard server.
pub async fn serve(port: u16, project_dir: PathBuf) -> Result<()> {
    let app = build_router(project_dir);
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .map_err(|e| crate::NexusError::Dashboard(format!("Failed to bind port {}: {}", port, e)))?;

    axum::serve(listener, app)
        .await
        .map_err(|e| crate::NexusError::Dashboard(format!("Server error: {}", e)))?;

    Ok(())
}
