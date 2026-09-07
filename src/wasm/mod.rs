use crate::error::{NexusError, Result};
use std::io::Read;
use std::path::Path;
use std::time::{Duration, Instant};
use wasmtime::{Config, Engine, Linker, Module, Store, StoreLimits, StoreLimitsBuilder};
use wasmtime_wasi::pipe::{MemoryInputPipe, MemoryOutputPipe};
use wasmtime_wasi::{preview1, I32Exit, WasiCtxBuilder, WasiP1Ctx};

pub const MAX_INPUT_BYTES: usize = 1024 * 1024;
pub const MAX_OUTPUT_BYTES: usize = 1024 * 1024;
const MAX_MODULE_BYTES: usize = 16 * 1024 * 1024;

/// Limits for a single foreground WASIp1 command. No host capabilities are inherited.
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    pub memory_limit: usize,
    /// Deadline for instantiation and execution (compilation is separate).
    pub timeout_secs: u64,
    pub fuel: u64,
    /// Reserved for future explicit capability grants; true is currently rejected.
    pub allow_network: bool,
    pub allow_fs: bool,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            memory_limit: 64 * 1024 * 1024,
            timeout_secs: 30,
            fuel: 50_000_000,
            allow_network: false,
            allow_fs: false,
        }
    }
}

struct SandboxState {
    wasi: WasiP1Ctx,
    limits: StoreLimits,
}

fn wasm_error(error: impl std::fmt::Display) -> NexusError {
    NexusError::Wasm(error.to_string())
}

fn read_module(path: &Path) -> Result<Vec<u8>> {
    let mut bytes = Vec::new();
    std::fs::File::open(path)?
        .take((MAX_MODULE_BYTES + 1) as u64)
        .read_to_end(&mut bytes)?;
    if bytes.len() > MAX_MODULE_BYTES {
        return Err(wasm_error("WASM module exceeds 16 MiB"));
    }
    if !bytes.starts_with(b"\0asm") {
        return Err(wasm_error(
            "Expected a binary WASM module (bad magic number)",
        ));
    }
    Ok(bytes)
}

/// Execute a WASIp1 module's `_start` export with empty stdin.
pub async fn execute_wasm(path: &Path, config: &SandboxConfig) -> Result<WasmResult> {
    execute_wasm_with_input(path, config, &[]).await
}

/// Execute real guest instructions with bounded stdin/stdout/stderr.
/// This path never consults a model, provider credentials, or an LLM health check.
pub async fn execute_wasm_with_input(
    path: &Path,
    config: &SandboxConfig,
    input: &[u8],
) -> Result<WasmResult> {
    if config.allow_network || config.allow_fs {
        return Err(wasm_error(
            "Network and filesystem grants are not supported by this runner",
        ));
    }
    if config.memory_limit == 0 || config.timeout_secs == 0 || config.fuel == 0 {
        return Err(wasm_error(
            "Memory, timeout, and fuel limits must be positive",
        ));
    }
    if input.len() > MAX_INPUT_BYTES {
        return Err(wasm_error("Agent input exceeds 1 MiB"));
    }

    // Compilation is CPU work; do not block the async executor while compiling.
    let path = path.to_owned();
    let (engine, module) = tokio::task::spawn_blocking(move || -> Result<_> {
        let bytes = read_module(&path)?;
        let mut engine_config = Config::new();
        engine_config.async_support(true).consume_fuel(true);
        let engine = Engine::new(&engine_config).map_err(wasm_error)?;
        let module = Module::new(&engine, bytes).map_err(wasm_error)?;
        Ok((engine, module))
    })
    .await
    .map_err(wasm_error)??;

    let stdout = MemoryOutputPipe::new(MAX_OUTPUT_BYTES + 1);
    let stderr = MemoryOutputPipe::new(MAX_OUTPUT_BYTES + 1);
    // Deliberately do not inherit environment, args, preopened directories, or sockets.
    let wasi = WasiCtxBuilder::new()
        .stdin(MemoryInputPipe::new(input.to_vec()))
        .stdout(stdout.clone())
        .stderr(stderr.clone())
        .build_p1();
    let limits = StoreLimitsBuilder::new()
        .memory_size(config.memory_limit)
        .memories(1)
        .tables(1)
        .table_elements(10_000)
        .instances(1)
        .trap_on_grow_failure(true)
        .build();
    let mut store = Store::new(&engine, SandboxState { wasi, limits });
    store.limiter(|state| &mut state.limits);
    store.set_fuel(config.fuel).map_err(wasm_error)?;
    // Yield during CPU loops so the deadline can fire, even on a single-thread runtime.
    store
        .fuel_async_yield_interval(Some(10_000))
        .map_err(wasm_error)?;
    let mut linker = Linker::new(&engine);
    preview1::add_to_linker_async(&mut linker, |state: &mut SandboxState| &mut state.wasi)
        .map_err(wasm_error)?;

    let started = Instant::now();
    let execution = async {
        let instance = linker.instantiate_async(&mut store, &module).await?;
        let start = instance.get_typed_func::<(), ()>(&mut store, "_start")?;
        let outcome = start.call_async(&mut store, ()).await;
        let memory_used = instance
            .get_memory(&mut store, "memory")
            .map(|memory| memory.data_size(&store))
            .unwrap_or(0);
        let exit_code = match outcome {
            Ok(()) => 0,
            Err(error) => match error.downcast_ref::<I32Exit>() {
                Some(exit) => exit.0,
                None => return Err(error),
            },
        };
        Ok::<_, anyhow::Error>((exit_code, memory_used))
    };
    let (exit_code, memory_used) =
        tokio::time::timeout(Duration::from_secs(config.timeout_secs), execution)
            .await
            .map_err(|_| wasm_error("WASM execution timed out"))?
            .map_err(|error| wasm_error(format!("WASM execution failed: {error:#}")))?;

    if stdout.contents().len() > MAX_OUTPUT_BYTES || stderr.contents().len() > MAX_OUTPUT_BYTES {
        return Err(wasm_error("Agent output exceeds 1 MiB per stream"));
    }
    Ok(WasmResult {
        exit_code,
        stdout: String::from_utf8_lossy(&stdout.contents()).into_owned(),
        stderr: String::from_utf8_lossy(&stderr.contents()).into_owned(),
        memory_used,
        execution_time_ms: started.elapsed().as_millis() as u64,
    })
}

#[derive(Debug)]
pub struct WasmResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub memory_used: usize,
    pub execution_time_ms: u64,
}

/// Validate the complete module, not just the WASM magic bytes.
pub fn validate_wasm(path: &Path) -> Result<WasmInfo> {
    let bytes = read_module(path)?;
    Module::validate(&Engine::default(), &bytes).map_err(wasm_error)?;
    Ok(WasmInfo {
        size_bytes: bytes.len(),
        valid: true,
    })
}

pub struct WasmInfo {
    pub size_bytes: usize,
    pub valid: bool,
}
