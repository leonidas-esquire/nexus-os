use crate::runtime_contract::{
    self, CancellationRequest, RegistrationRequest, SubmissionRequest, SuspensionRequest,
};
use clap::Subcommand;
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fs;
use std::io::{self, Read};

use super::open_project_db;

const MAX_REQUEST_BYTES: usize = 262_144;

#[derive(Debug, Subcommand)]
pub enum RuntimeAction {
    /// Register an exact governed external agent binding.
    RegisterAgent {
        #[arg(long, default_value = "-")]
        request_file: String,
    },

    /// Submit an immutable governed work-package binding.
    Submit {
        #[arg(long, default_value = "-")]
        request_file: String,
    },

    /// Inspect one exact runtime execution.
    Inspect { execution_id: String },

    /// Read bounded ordered execution events.
    Events {
        execution_id: String,
        #[arg(long, default_value_t = 100)]
        max_events: usize,
        #[arg(long, default_value_t = 0)]
        after_sequence: u64,
    },

    /// Request governed execution cancellation.
    Cancel {
        #[arg(long, default_value = "-")]
        request_file: String,
    },

    /// Suspend one exact runtime agent registration.
    SuspendAgent {
        #[arg(long, default_value = "-")]
        request_file: String,
    },

    /// Collect bounded terminal execution evidence.
    Evidence {
        execution_id: String,
        #[arg(long)]
        collected_at: String,
        #[arg(long, default_value_t = 100)]
        max_events: usize,
    },

    /// Inspect machine-readable runtime-provider health.
    Health,
}

fn read_request<T: DeserializeOwned>(request_file: &str) -> runtime_contract::RuntimeResult<T> {
    let mut bytes = Vec::new();

    if request_file == "-" {
        io::stdin()
            .take((MAX_REQUEST_BYTES + 1) as u64)
            .read_to_end(&mut bytes)
            .map_err(|error| runtime_contract::RuntimeContractError {
                code: "nxrt-input-invalid",
                message: format!("Unable to read runtime request from stdin: {error}"),
                path: Some("request".to_string()),
            })?;
    } else {
        bytes = fs::read(request_file).map_err(|error| runtime_contract::RuntimeContractError {
            code: "nxrt-input-invalid",
            message: format!("Unable to read runtime request file: {error}"),
            path: Some("requestFile".to_string()),
        })?;
    }

    if bytes.is_empty() || bytes.len() > MAX_REQUEST_BYTES {
        return Err(runtime_contract::RuntimeContractError {
            code: "nxrt-input-invalid",
            message: format!(
                "Runtime request must contain from 1 through {MAX_REQUEST_BYTES} bytes."
            ),
            path: Some("request".to_string()),
        });
    }

    serde_json::from_slice(&bytes).map_err(|error| runtime_contract::RuntimeContractError {
        code: "nxrt-input-invalid",
        message: format!("Runtime request must be valid contract JSON: {error}"),
        path: Some("request".to_string()),
    })
}

fn write_success<T: Serialize>(value: T) -> i32 {
    match serde_json::to_string(&runtime_contract::success_envelope(value)) {
        Ok(serialized) => {
            println!("{serialized}");
            0
        }
        Err(error) => {
            eprintln!(
                "{}",
                serde_json::to_string(&runtime_contract::error_envelope(
                    runtime_contract::RuntimeContractError {
                        code: "nxrt-provider-unavailable",
                        message: format!("Unable to serialize runtime response: {error}"),
                        path: Some("response".to_string()),
                    }
                ))
                .unwrap_or_else(|_| "{\"ok\":false}".to_string())
            );
            1
        }
    }
}

fn write_error(error: runtime_contract::RuntimeContractError) -> i32 {
    eprintln!(
        "{}",
        serde_json::to_string(&runtime_contract::error_envelope(error))
            .unwrap_or_else(|_| "{\"ok\":false}".to_string())
    );
    1
}

pub async fn dispatch(action: RuntimeAction) -> i32 {
    let result = (|| -> runtime_contract::RuntimeResult<serde_json::Value> {
        let conn = open_project_db().map_err(|error| runtime_contract::RuntimeContractError {
            code: "nxrt-provider-unavailable",
            message: format!("Unable to open Nexus project runtime database: {error}"),
            path: Some("database".to_string()),
        })?;

        let value = match action {
            RuntimeAction::RegisterAgent { request_file } => {
                let request: RegistrationRequest = read_request(&request_file)?;
                serde_json::to_value(runtime_contract::register_agent(&conn, &request)?)
            }

            RuntimeAction::Submit { request_file } => {
                let request: SubmissionRequest = read_request(&request_file)?;
                serde_json::to_value(runtime_contract::submit(&conn, &request)?)
            }

            RuntimeAction::Inspect { execution_id } => {
                serde_json::to_value(runtime_contract::inspect(&conn, &execution_id)?)
            }

            RuntimeAction::Events {
                execution_id,
                max_events,
                after_sequence,
            } => serde_json::to_value(runtime_contract::events(
                &conn,
                &execution_id,
                after_sequence,
                max_events,
            )?),

            RuntimeAction::Cancel { request_file } => {
                let request: CancellationRequest = read_request(&request_file)?;
                serde_json::to_value(runtime_contract::cancel(&conn, &request)?)
            }

            RuntimeAction::SuspendAgent { request_file } => {
                let request: SuspensionRequest = read_request(&request_file)?;
                serde_json::to_value(runtime_contract::suspend_agent(&conn, &request)?)
            }

            RuntimeAction::Evidence {
                execution_id,
                collected_at,
                max_events,
            } => serde_json::to_value(runtime_contract::evidence(
                &conn,
                &execution_id,
                &collected_at,
                max_events,
            )?),

            RuntimeAction::Health => serde_json::to_value(runtime_contract::health(&conn)?),
        }
        .map_err(|error| runtime_contract::RuntimeContractError {
            code: "nxrt-provider-unavailable",
            message: format!("Unable to serialize runtime data: {error}"),
            path: Some("response".to_string()),
        })?;

        Ok(value)
    })();

    match result {
        Ok(value) => write_success(value),
        Err(error) => write_error(error),
    }
}
