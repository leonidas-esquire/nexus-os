//! # Nexus OS
//!
//! The orchestration layer for AI agents. One CLI to create, supervise,
//! and scale AI agents with WASM sandboxing, Erlang-style fault tolerance,
//! and token-cost optimization.

pub mod agent;
pub mod audit;
pub mod broker;
pub mod cli;
pub mod config;
pub mod cost;
pub mod dashboard;
pub mod db;
pub mod edge;
pub mod error;
pub mod marketplace;
pub mod pool;
pub mod saga;
pub mod supervisor;
pub mod trust;
pub mod wasm;
pub mod workflow;

pub use error::{NexusError, Result};
