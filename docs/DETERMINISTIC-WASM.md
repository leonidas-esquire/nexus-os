# Deterministic WASM agents without an LLM

`naos run` executes a compiled WASIp1 command module in Wasmtime. It supplies
bounded input on stdin, captures stdout/stderr, and records actual completion or
failure. This execution path makes no LLM calls and does not check model health
or require provider credentials.

An agent must contain the logic needed for its task. Packaging an LLM-dependent
program as WASM does not remove that dependency. This runner supports local,
foreground, one-task executions; it does not implement the supervisor, saga,
pool, or broker dispatch placeholders elsewhere in the project.

## Run the included record-validation agent

From the repository root, with Rust installed:

```bash
rustup target add wasm32-wasip1
cargo build
cargo build --manifest-path examples/deterministic-agent/Cargo.toml \
  --target wasm32-wasip1 --release
./target/debug/naos init offline-demo
cp examples/deterministic-agent/target/wasm32-wasip1/release/record-total-agent.wasm offline-demo/agents/
cp examples/deterministic-agent/input.json offline-demo/input.json
cd offline-demo
../target/debug/naos create records --source agents/record-total-agent.wasm
../target/debug/naos run records --input input.json
../target/debug/naos audit tail
```

Expected JSON output (key order may differ):

```json
{"valid":true,"record_count":2,"total_cents":4000}
```

The guest validates the JSON schema, required nonempty unique IDs, nonnegative
integer amounts, and arithmetic overflow. It computes the total inside WASM.
Invalid input writes a JSON error to stderr and exits with code 2; the CLI returns
nonzero and records `agent.failed`. It never fabricates a successful result.

To check model unavailability, rerun the same task with no model keys and
unreachable provider/proxy endpoints:

```bash
env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u GEMINI_API_KEY \
  OPENAI_BASE_URL=http://127.0.0.1:1 \
  ANTHROPIC_BASE_URL=http://127.0.0.1:1 \
  HTTP_PROXY=http://127.0.0.1:1 HTTPS_PROXY=http://127.0.0.1:1 \
  ALL_PROXY=http://127.0.0.1:1 NO_PROXY= \
  ../target/debug/naos run records --input input.json
```

## Interface and limits

- Module: binary WASIp1 (`wasm32-wasip1`) with a `_start: () -> ()` export.
  Core modules without WASI imports can also use this entry point.
- Input: `--input file.json`, `--input -` for stdin, or empty input if omitted.
- Output: guest stdout on CLI stdout; guest stderr and host status on CLI stderr.
- Sources: `create --source` stores a project-relative path when possible.
  Alternatively, create an agent record and set `agents.<name>.source` in
  `nexus.config.yaml`; config paths resolve from the project root, even when
  invoking the command in a subdirectory. A stored source takes precedence.
- Default limits: 64 MiB guest linear memory, 50 million fuel units, 30 seconds
  for instantiation and execution, 16 MiB module bytes, 1 MiB stdin, and 1 MiB
  per output stream. CLI overrides: `--memory-mb`, `--fuel`, `--timeout`.
- Fuel limits CPU work. Async fuel yields allow the wall deadline to interrupt
  an infinite loop. File reading and compilation happen separately on a blocking
  worker and are not covered by the guest execution deadline.
- Guest memory limits do not cap the host compiler's memory usage. One memory,
  one table (up to 10,000 elements), and one instance are permitted per execution.
- No host environment variables, API keys, directories, or network sockets are
  inherited. Filesystem/network grant flags are rejected until explicit grant
  support exists. WASI clocks and random functions are available; deterministic
  results depend on the guest's logic, not on WASM alone.
- Traps, malformed modules, unsupported imports, missing entry points, resource
  exhaustion, and nonzero guest exit codes fail explicitly.
- Completion clears the PID and leaves the agent stopped, ready for another task.
  Failure clears the PID and records a crashed state; a subsequent task can retry.
  Paused or already-running agents cannot be started.
- Tasks run in the foreground. Ctrl-C interrupts and records failure. The `stop`
  command refuses to claim it stopped an active foreground task. Abrupt host
  termination (for example SIGKILL) can leave a stale running record; durable
  process recovery remains outside this change.

## Verification

Install `wasm32-wasip1`, then run `cargo test --all-targets`. The CLI tests build
the sample guest, execute multiple inputs with unavailable model endpoints,
verify real computed outputs and audit records, and exercise invalid input and
recovery. Sandbox tests cover traps, memory/fuel/deadline enforcement, explicit
exit codes, and absence of inherited environment and filesystem capabilities.

Supported claim: **LLM disconnected. Deterministic tasks keep running.**
This applies to executable tasks that do not themselves require an LLM or a
capability unavailable in the sandbox. It does not claim automatic conversion
of model-dependent tasks into deterministic ones.
