use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Root project configuration (`nexus.config.yaml`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,

    #[serde(default)]
    pub agents: HashMap<String, AgentConfig>,

    #[serde(default)]
    pub supervisors: HashMap<String, SupervisorConfig>,

    pub trust: Option<TrustConfig>,
    pub broker: Option<BrokerConfig>,
    pub edge: Option<EdgeConfig>,
}

/// Per-agent configuration block.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Path to the agent source (WASM module, script, etc.).
    pub source: Option<String>,

    /// Agent template to use if no source is provided.
    pub template: Option<String>,

    /// Cost budget configuration.
    pub cost: Option<CostConfig>,

    /// AXIS Trust identity.
    pub axis: Option<AxisConfig>,

    /// Environment variables passed to the agent.
    #[serde(default)]
    pub env: HashMap<String, String>,
}

/// Supervisor configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupervisorConfig {
    /// Restart strategy: one-for-one, one-for-all, rest-for-one.
    pub strategy: String,

    /// Maximum restarts within the restart window.
    #[serde(rename = "maxRestarts", default = "default_max_restarts")]
    pub max_restarts: u32,

    /// Restart window in seconds.
    #[serde(rename = "restartWindow", default = "default_restart_window")]
    pub restart_window: u64,

    /// Child agent names.
    #[serde(default)]
    pub children: Vec<String>,
}

fn default_max_restarts() -> u32 {
    3
}

fn default_restart_window() -> u64 {
    60
}

/// Cost budget for an agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostConfig {
    /// Budget string, e.g. "$10/day".
    pub budget: String,

    /// Alert threshold percentage (0-100).
    #[serde(rename = "alertAt", default)]
    pub alert_at: Option<u32>,

    /// Action when budget exceeded: pause, throttle, alert.
    pub action: Option<String>,
}

/// AXIS Trust identity.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AxisConfig {
    /// AXIS Unique Identifier.
    pub auid: Option<String>,
}

/// Global trust configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustConfig {
    pub provider: String,

    pub requirements: Option<TrustRequirements>,
    pub enforcement: Option<TrustEnforcement>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustRequirements {
    #[serde(rename = "minTrustTier")]
    pub min_trust_tier: Option<String>,

    #[serde(rename = "minTScore")]
    pub min_t_score: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustEnforcement {
    #[serde(rename = "onUntrusted")]
    pub on_untrusted: Option<String>,
}

/// Broker routing configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrokerConfig {
    pub enabled: bool,

    pub routing: Option<BrokerRouting>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrokerRouting {
    #[serde(rename = "preferSkill", default)]
    pub prefer_skill: bool,

    #[serde(rename = "llmAsLastResort", default)]
    pub llm_as_last_resort: bool,
}

/// Edge deployment configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EdgeConfig {
    pub provider: Option<String>,
    pub account_id: Option<String>,
}
