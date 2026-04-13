mod types;

pub use types::*;

use crate::error::{NexusError, Result};
use std::path::{Path, PathBuf};

/// Default config filename.
pub const CONFIG_FILE: &str = "nexus.config.yaml";

/// Locate the config file by walking up from `start` until we find it.
pub fn find_config(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    loop {
        let candidate = dir.join(CONFIG_FILE);
        if candidate.is_file() {
            return Some(candidate);
        }
        if !dir.pop() {
            return None;
        }
    }
}

/// Load and parse the project configuration.
pub fn load_config(path: &Path) -> Result<ProjectConfig> {
    let contents = std::fs::read_to_string(path)
        .map_err(|e| NexusError::Config(format!("Failed to read {}: {}", path.display(), e)))?;
    let config: ProjectConfig = serde_yaml::from_str(&contents)?;
    Ok(config)
}

/// Write a default configuration file.
pub fn write_default_config(dir: &Path, name: &str) -> Result<PathBuf> {
    let config = ProjectConfig {
        name: name.to_string(),
        agents: std::collections::HashMap::new(),
        supervisors: std::collections::HashMap::new(),
        trust: None,
        broker: None,
        edge: None,
    };
    let path = dir.join(CONFIG_FILE);
    let yaml = serde_yaml::to_string(&config)?;
    std::fs::write(&path, yaml)?;
    Ok(path)
}
