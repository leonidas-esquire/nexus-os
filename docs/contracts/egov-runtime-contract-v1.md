# Nexus OS Governed Runtime Contract v1

Governing issue: #4

Pinned baseline:

`7cbff44e9725bca7d59370cf2e639d7167ee9a00`

## Status

Runtime-control contract implementation candidate for review.

Protocol:

- name: `nexus-runtime`
- version: `1.0.0`
- transport: deterministic JSON over the `naos runtime` CLI surface
- legacy human CLI output is never parsed by the eGovernment.ai adapter

## Audited baseline problem

The pre-contract Nexus lifecycle commands are agent-state commands, not an
execution protocol:

- `naos run` simulates start and records the CLI process PID.
- `naos stop` changes persisted agent state but does not prove cancellation of
  a real execution.
- there is no execution ID, governed work-package binding, authorization
  binding, manifest binding, registry-record binding or submission idempotency.
- there is no durable cancellation/suspension receipt.
- there is no explicit recovery-required execution state.
- audit records provide useful Lamport ordering and content hashes but are not
  execution-scoped evidence bundles.
- the audited Rust CLI does not expose the JSON audit/export behavior described
  in product documentation.

## Truthful execution boundary

Contract v1 is a **control-plane runtime protocol**.

It creates durable execution identities, state, events, receipts and evidence,
but does not claim that the audited Nexus runtime can yet execute a real agent
workload. Health therefore reports:

- `executionMode: "control-plane-only"`
- `supportsRealExecution: false`

A production eGovernment.ai Nexus adapter must fail closed when real execution
is required until Nexus adds a separately certified executor implementation.

This avoids converting the legacy simulated `naos run` behavior into false
production evidence.

## Authority boundary

Nexus owns runtime mechanics and provider state.

eGovernment.ai owns:

- authoritative agent identity and manifests
- governed work packages and authorizations
- policy and approval
- repository / branch / path / tool / network authority
- trust policy
- workflow transitions
- merge, release, publication and deployment authority
- suspension / revocation authority
- recovery closure
- production activation

Nexus output is evidence and provider state. It never grants platform authority.

## Machine-readable operations

### Agent registration

`naos runtime register-agent --request-file <path|->`

Request binds:

- `registrationId`
- `externalAgentId`
- `agentVersion`
- `manifestDigest`
- `registryRecordDigest`
- `configurationDigest`
- `registeredAt`

Exact replay is idempotent. Changed bytes under the same registration ID fail.

### Submission

`naos runtime submit --request-file <path|->`

Request binds:

- `requestId`
- `idempotencyKey`
- `registrationId`
- `workPackageDigest`
- `authorizationDigest`
- `manifestDigest`
- `registryRecordDigest`
- `inputDigest`
- bounded budget / timeout / retry / concurrency metadata
- `submittedAt`
- `deadlineAt`

Submission creates an immutable execution ID derived from the exact request
digest. Exact idempotent replay returns the same execution. Reuse of the same
idempotency key with changed bytes fails closed.

Because v1 is control-plane-only, submission begins in `accepted`; it does not
claim an agent process started.

### Inspection

`naos runtime inspect <executionId>`

Returns exact execution state and immutable request binding.

Provider states:

- `accepted`
- `running`
- `succeeded`
- `failed`
- `cancelled`
- `suspended`
- `timed-out`
- `recovery-required`

Terminal state is explicit.

### Events

`naos runtime events <executionId> --max-events <n> [--after-sequence <n>]`

Events are execution-scoped, ordered, bounded and content-hashed.

### Cancellation

`naos runtime cancel --request-file <path|->`

Cancellation requires an exact execution ID, work-package digest,
authorization digest, request ID and reason digest.

Exact replay is idempotent.

- an `accepted` execution can be proven not to have entered a real executor and
  transitions to `cancelled`
- a `running` execution without a certified executor cancellation receipt
  transitions to `recovery-required`
- terminal executions return an `alreadyTerminal` receipt without rewriting
  terminal state

### Registration suspension

`naos runtime suspend-agent --request-file <path|->`

Suspension requires exact registration and authorization binding. New
submissions are rejected while suspended. Nonterminal execution effects are
reported explicitly.

### Evidence

`naos runtime evidence <executionId> --collected-at <timestamp> --max-events <n>`

Evidence is available only for terminal executions and binds:

- execution ID
- work-package digest
- authorization digest
- manifest digest
- registry-record digest
- request digest
- terminal state
- ordered event digests
- Nexus protocol/build identity
- evidence digest

Evidence/event output is bounded.

### Health

`naos runtime health`

Returns protocol/build identity, database availability, registration/execution
counts, execution mode and real-execution capability.

## Build identity

Every response contains:

- `protocol: "nexus-runtime"`
- `protocolVersion: "1.0.0"`
- Cargo crate version
- exact source commit captured at build time
- whether the source tree was dirty at build time

eGovernment.ai must pin supported protocol and build identities. It must reject
unverified/dirty production builds.

## Stable error codes

Contract v1 reserves stable codes including:

- `nxrt-input-invalid`
- `nxrt-protocol-unsupported`
- `nxrt-registration-conflict`
- `nxrt-registration-not-found`
- `nxrt-registration-suspended`
- `nxrt-idempotency-conflict`
- `nxrt-execution-not-found`
- `nxrt-state-invalid`
- `nxrt-already-terminal`
- `nxrt-authorization-binding-invalid`
- `nxrt-event-bound-exceeded`
- `nxrt-rate-limited`
- `nxrt-timeout`
- `nxrt-provider-unavailable`
- `nxrt-recovery-required`

## Explicit exclusions

This contract does not authorize or claim:

- real production agent execution
- eGovernment.ai agent activation
- eGovernment.ai credentials
- AXIS Trust API calls or credentials
- trust-score authority
- automatic recovery closure
- release/tag publication
- deployment
- changes to eGovernment.ai source
- Phase 5 changes

Human review and explicit merge/release authorization remain required.
