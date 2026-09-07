use super::{open_project_db, project_root};
use crate::agent::{self, AgentStatus};
use crate::audit;
use crate::error::{NexusError, Result};
use crate::wasm::{execute_wasm_with_input, SandboxConfig, MAX_INPUT_BYTES};
use std::io::{Read, Write};

pub async fn run(name: &str, input_file: Option<&str>, sandbox: &SandboxConfig) -> Result<()> {
    let conn = open_project_db()?;
    let ag = agent::get_agent(&conn, name)?;
    if matches!(ag.status, AgentStatus::Running | AgentStatus::Paused) {
        return Err(NexusError::Agent(format!(
            "Agent '{name}' is {}",
            ag.status
        )));
    }
    let root = project_root()?;
    let config = crate::config::load_config(&root.join(crate::config::CONFIG_FILE))?;
    let source = ag.source.as_deref()
        .or_else(|| config.agents.get(name).and_then(|agent| agent.source.as_deref()))
        .ok_or_else(|| NexusError::Agent(format!(
            "Agent '{name}' has no WASM source. Create with --source <module.wasm> or set agents.{name}.source in nexus.config.yaml."
        )))?;
    let path = root.join(source);
    let mut input = Vec::new();
    let reader: Option<Box<dyn Read>> = match input_file {
        None => None,
        Some("-") => Some(Box::new(std::io::stdin())),
        Some(file) => Some(Box::new(std::fs::File::open(file)?)),
    };
    if let Some(reader) = reader {
        reader
            .take((MAX_INPUT_BYTES + 1) as u64)
            .read_to_end(&mut input)?;
    }
    if input.len() > MAX_INPUT_BYTES {
        return Err(NexusError::Agent("Agent input exceeds 1 MiB".into()));
    }

    // Claim the agent atomically. A second invocation must not execute it concurrently.
    let tx = conn.unchecked_transaction()?;
    let changed = tx.execute(
        "UPDATE agents SET status = 'running', pid = ?1, updated_at = datetime('now') WHERE name = ?2 AND status IN ('stopped', 'crashed')",
        rusqlite::params![std::process::id(), name],
    )?;
    if changed != 1 {
        return Err(NexusError::Agent(format!(
            "Agent '{name}' is no longer available to run"
        )));
    }
    audit::log_event(
        &tx,
        Some(name),
        "agent.started",
        Some("runtime=wasm model_required=false"),
    )?;
    tx.commit()?;

    // No LLM preflight, credentials, routing call, or network dependency gates this path.
    let outcome = tokio::select! {
        result = execute_wasm_with_input(&path, sandbox, &input) => result,
        signal = tokio::signal::ctrl_c() => {
            signal.map_err(NexusError::from).and_then(|_| Err(NexusError::Agent("Agent execution interrupted".into())))
        }
    };
    let succeeded = matches!(&outcome, Ok(result) if result.exit_code == 0);
    let detail = match &outcome {
        Ok(result) => format!(
            "runtime=wasm exit_code={} memory_bytes={} execution_ms={}",
            result.exit_code, result.memory_used, result.execution_time_ms
        ),
        Err(error) => error.to_string(),
    };
    let tx = conn.unchecked_transaction()?;
    agent::set_agent_status(
        &tx,
        name,
        if succeeded {
            AgentStatus::Stopped
        } else {
            AgentStatus::Crashed
        },
        None,
    )?;
    audit::log_event(
        &tx,
        Some(name),
        if succeeded {
            "agent.completed"
        } else {
            "agent.failed"
        },
        Some(&detail),
    )?;
    tx.commit()?;

    let result = outcome?;
    // Preserve guest output for piping; status messages go to stderr.
    std::io::stdout().write_all(result.stdout.as_bytes())?;
    std::io::stderr().write_all(result.stderr.as_bytes())?;
    if !succeeded {
        return Err(NexusError::Agent(format!(
            "Agent '{name}' exited with code {}",
            result.exit_code
        )));
    }
    eprintln!("Agent '{name}' completed (WASM, no LLM required)");
    Ok(())
}
