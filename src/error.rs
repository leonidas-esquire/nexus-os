use thiserror::Error;

/// Top-level error type for the Nexus OS runtime.
#[derive(Error, Debug)]
pub enum NexusError {
    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("Agent error: {0}")]
    Agent(String),

    #[error("Supervisor error: {0}")]
    Supervisor(String),

    #[error("Saga error: {0}")]
    Saga(String),

    #[error("Workflow error: {0}")]
    Workflow(String),

    #[error("Pool error: {0}")]
    Pool(String),

    #[error("Broker error: {0}")]
    Broker(String),

    #[error("Cost error: {0}")]
    Cost(String),

    #[error("Trust error: {0}")]
    Trust(String),

    #[error("Edge deployment error: {0}")]
    Edge(String),

    #[error("WASM runtime error: {0}")]
    Wasm(String),

    #[error("Dashboard error: {0}")]
    Dashboard(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),

    #[error("{0}")]
    Other(String),
}

pub type Result<T> = std::result::Result<T, NexusError>;
