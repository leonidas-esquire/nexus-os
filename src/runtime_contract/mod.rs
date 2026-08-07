use chrono::{DateTime, Utc};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const PROTOCOL: &str = "nexus-runtime";
pub const PROTOCOL_VERSION: &str = "1.0.0";
pub const EXECUTION_MODE: &str = "control-plane-only";
pub const MAX_EVENT_BATCH: usize = 1000;

pub type RuntimeResult<T> = Result<T, RuntimeContractError>;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeContractError {
    pub code: &'static str,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

impl RuntimeContractError {
    fn new(code: &'static str, message: impl Into<String>, path: Option<&str>) -> Self {
        Self {
            code,
            message: message.into(),
            path: path.map(ToOwned::to_owned),
        }
    }
}

impl std::fmt::Display for RuntimeContractError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for RuntimeContractError {}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildIdentity {
    pub crate_version: &'static str,
    pub source_commit: &'static str,
    pub source_dirty: bool,
}

pub fn build_identity() -> BuildIdentity {
    BuildIdentity {
        crate_version: env!("CARGO_PKG_VERSION"),
        source_commit: env!("NEXUS_SOURCE_COMMIT"),
        source_dirty: env!("NEXUS_SOURCE_DIRTY") == "true",
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SuccessEnvelope<T: Serialize> {
    pub protocol: &'static str,
    pub protocol_version: &'static str,
    pub build: BuildIdentity,
    pub ok: bool,
    pub data: T,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorEnvelope {
    pub protocol: &'static str,
    pub protocol_version: &'static str,
    pub build: BuildIdentity,
    pub ok: bool,
    pub error: RuntimeContractError,
}

pub fn success_envelope<T: Serialize>(data: T) -> SuccessEnvelope<T> {
    SuccessEnvelope {
        protocol: PROTOCOL,
        protocol_version: PROTOCOL_VERSION,
        build: build_identity(),
        ok: true,
        data,
    }
}

pub fn error_envelope(error: RuntimeContractError) -> ErrorEnvelope {
    ErrorEnvelope {
        protocol: PROTOCOL,
        protocol_version: PROTOCOL_VERSION,
        build: build_identity(),
        ok: false,
        error,
    }
}

fn database_error(error: rusqlite::Error) -> RuntimeContractError {
    RuntimeContractError::new(
        "nxrt-provider-unavailable",
        format!("Runtime database operation failed: {error}"),
        Some("database"),
    )
}

fn serialization_error(error: serde_json::Error) -> RuntimeContractError {
    RuntimeContractError::new(
        "nxrt-input-invalid",
        format!("Runtime JSON serialization failed: {error}"),
        Some("json"),
    )
}

fn hash_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

fn digest_json<T: Serialize>(value: &T) -> RuntimeResult<String> {
    serde_json::to_vec(value)
        .map(|bytes| hash_bytes(&bytes))
        .map_err(serialization_error)
}

fn identifier(value: &str, path: &str) -> RuntimeResult<String> {
    let valid = !value.is_empty()
        && value.len() <= 256
        && value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | ':' | '/' | '-')
        });

    if !valid {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            format!("'{path}' must be a bounded runtime identifier."),
            Some(path),
        ));
    }

    Ok(value.to_string())
}

fn digest(value: &str, path: &str) -> RuntimeResult<String> {
    if value.len() != 64
        || !value
            .chars()
            .all(|character| character.is_ascii_digit() || ('a'..='f').contains(&character))
    {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            format!("'{path}' must be a lowercase SHA-256 digest."),
            Some(path),
        ));
    }

    Ok(value.to_string())
}

fn timestamp(value: &str, path: &str) -> RuntimeResult<String> {
    let parsed = DateTime::parse_from_rfc3339(value).map_err(|_| {
        RuntimeContractError::new(
            "nxrt-input-invalid",
            format!("'{path}' must be an RFC3339 timestamp."),
            Some(path),
        )
    })?;

    Ok(parsed
        .with_timezone(&Utc)
        .to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
}

fn positive_integer(value: u64, maximum: u64, path: &str) -> RuntimeResult<u64> {
    if value == 0 || value > maximum {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            format!("'{path}' must be from 1 through {maximum}."),
            Some(path),
        ));
    }

    Ok(value)
}

fn nonnegative_number(value: f64, maximum: f64, path: &str) -> RuntimeResult<f64> {
    if !value.is_finite() || value < 0.0 || value > maximum {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            format!("'{path}' must be a finite nonnegative number no greater than {maximum}."),
            Some(path),
        ));
    }

    Ok(value)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RegistrationRequest {
    pub registration_id: String,
    pub external_agent_id: String,
    pub agent_version: String,
    pub manifest_digest: String,
    pub registry_record_digest: String,
    pub configuration_digest: String,
    pub registered_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExecutionBudget {
    pub max_cost_usd: f64,
    pub timeout_ms: u64,
    pub max_retries: u32,
    pub max_concurrency: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SubmissionRequest {
    pub request_id: String,
    pub idempotency_key: String,
    pub registration_id: String,
    pub work_package_digest: String,
    pub authorization_digest: String,
    pub manifest_digest: String,
    pub registry_record_digest: String,
    pub input_digest: String,
    pub budget: ExecutionBudget,
    pub submitted_at: String,
    pub deadline_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CancellationRequest {
    pub request_id: String,
    pub execution_id: String,
    pub work_package_digest: String,
    pub authorization_digest: String,
    pub reason_digest: String,
    pub requested_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SuspensionRequest {
    pub request_id: String,
    pub registration_id: String,
    pub authorization_digest: String,
    pub reason_digest: String,
    pub requested_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum RegistrationState {
    Registered,
    Suspended,
}

impl RegistrationState {
    fn parse(value: &str) -> RuntimeResult<Self> {
        match value {
            "registered" => Ok(Self::Registered),
            "suspended" => Ok(Self::Suspended),
            _ => Err(RuntimeContractError::new(
                "nxrt-provider-unavailable",
                format!("Unknown persisted registration state '{value}'."),
                Some("registration.state"),
            )),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ExecutionState {
    Accepted,
    Running,
    Succeeded,
    Failed,
    Cancelled,
    Suspended,
    TimedOut,
    RecoveryRequired,
}

impl ExecutionState {
    pub fn terminal(&self) -> bool {
        matches!(
            self,
            Self::Succeeded
                | Self::Failed
                | Self::Cancelled
                | Self::TimedOut
                | Self::RecoveryRequired
        )
    }

    fn as_str(&self) -> &'static str {
        match self {
            Self::Accepted => "accepted",
            Self::Running => "running",
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Suspended => "suspended",
            Self::TimedOut => "timed-out",
            Self::RecoveryRequired => "recovery-required",
        }
    }

    fn parse(value: &str) -> RuntimeResult<Self> {
        match value {
            "accepted" => Ok(Self::Accepted),
            "running" => Ok(Self::Running),
            "succeeded" => Ok(Self::Succeeded),
            "failed" => Ok(Self::Failed),
            "cancelled" => Ok(Self::Cancelled),
            "suspended" => Ok(Self::Suspended),
            "timed-out" => Ok(Self::TimedOut),
            "recovery-required" => Ok(Self::RecoveryRequired),
            _ => Err(RuntimeContractError::new(
                "nxrt-provider-unavailable",
                format!("Unknown persisted execution state '{value}'."),
                Some("execution.state"),
            )),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationReceipt {
    pub registration_id: String,
    pub external_agent_id: String,
    pub agent_version: String,
    pub manifest_digest: String,
    pub registry_record_digest: String,
    pub configuration_digest: String,
    pub state: RegistrationState,
    pub registered_at: String,
    pub suspended_at: Option<String>,
    pub request_digest: String,
    pub execution_mode: &'static str,
    pub supports_real_execution: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionRecord {
    pub execution_id: String,
    pub request_id: String,
    pub idempotency_key: String,
    pub registration_id: String,
    pub work_package_digest: String,
    pub authorization_digest: String,
    pub manifest_digest: String,
    pub registry_record_digest: String,
    pub input_digest: String,
    pub budget: ExecutionBudget,
    pub submitted_at: String,
    pub deadline_at: String,
    pub state: ExecutionState,
    pub terminal: bool,
    pub created_at: String,
    pub updated_at: String,
    pub request_digest: String,
    pub execution_mode: &'static str,
    pub supports_real_execution: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEvent {
    pub execution_id: String,
    pub sequence: u64,
    pub event_type: String,
    pub occurred_at: String,
    pub detail_digest: String,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventBatch {
    pub execution_id: String,
    pub after_sequence: u64,
    pub max_events: usize,
    pub events: Vec<RuntimeEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ControlReceipt {
    receipt_id: String,
    operation: String,
    request_id: String,
    request_digest: String,
    execution_id: Option<String>,
    registration_id: Option<String>,
    state: String,
    already_terminal: bool,
    acknowledged_at: String,
    authorization_digest: String,
    affected_execution_ids: Vec<String>,
    content_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CancellationReceipt {
    pub receipt_id: String,
    pub execution_id: String,
    pub state: ExecutionState,
    pub already_terminal: bool,
    pub acknowledged_at: String,
    pub authorization_digest: String,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SuspensionReceipt {
    pub receipt_id: String,
    pub registration_id: String,
    pub state: RegistrationState,
    pub affected_execution_ids: Vec<String>,
    pub acknowledged_at: String,
    pub authorization_digest: String,
    pub content_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceBundle {
    pub evidence_id: String,
    pub execution_id: String,
    pub work_package_digest: String,
    pub authorization_digest: String,
    pub manifest_digest: String,
    pub registry_record_digest: String,
    pub input_digest: String,
    pub request_digest: String,
    pub terminal_state: ExecutionState,
    pub events: Vec<RuntimeEvent>,
    pub event_digests: Vec<String>,
    pub collected_at: String,
    pub protocol: &'static str,
    pub protocol_version: &'static str,
    pub build: BuildIdentity,
    pub execution_mode: &'static str,
    pub supports_real_execution: bool,
    pub evidence_digest: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Health {
    pub state: &'static str,
    pub protocol: &'static str,
    pub protocol_version: &'static str,
    pub build: BuildIdentity,
    pub database_available: bool,
    pub registration_count: u64,
    pub execution_count: u64,
    pub execution_mode: &'static str,
    pub supports_real_execution: bool,
    pub checked_at: String,
}

pub fn validate_registration_request(request: &RegistrationRequest) -> RuntimeResult<()> {
    identifier(&request.registration_id, "registrationId")?;
    identifier(&request.external_agent_id, "externalAgentId")?;
    identifier(&request.agent_version, "agentVersion")?;
    digest(&request.manifest_digest, "manifestDigest")?;
    digest(&request.registry_record_digest, "registryRecordDigest")?;
    digest(&request.configuration_digest, "configurationDigest")?;
    timestamp(&request.registered_at, "registeredAt")?;
    Ok(())
}

pub fn validate_submission_request(request: &SubmissionRequest) -> RuntimeResult<()> {
    identifier(&request.request_id, "requestId")?;
    identifier(&request.idempotency_key, "idempotencyKey")?;
    identifier(&request.registration_id, "registrationId")?;
    digest(&request.work_package_digest, "workPackageDigest")?;
    digest(&request.authorization_digest, "authorizationDigest")?;
    digest(&request.manifest_digest, "manifestDigest")?;
    digest(&request.registry_record_digest, "registryRecordDigest")?;
    digest(&request.input_digest, "inputDigest")?;
    nonnegative_number(
        request.budget.max_cost_usd,
        1_000_000.0,
        "budget.maxCostUsd",
    )?;
    positive_integer(request.budget.timeout_ms, 86_400_000, "budget.timeoutMs")?;

    if request.budget.max_retries > 10 {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            "budget.maxRetries must be from 0 through 10.",
            Some("budget.maxRetries"),
        ));
    }

    if request.budget.max_concurrency == 0 || request.budget.max_concurrency > 32 {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            "budget.maxConcurrency must be from 1 through 32.",
            Some("budget.maxConcurrency"),
        ));
    }

    let submitted_at = timestamp(&request.submitted_at, "submittedAt")?;
    let deadline_at = timestamp(&request.deadline_at, "deadlineAt")?;

    if DateTime::parse_from_rfc3339(&deadline_at).unwrap()
        <= DateTime::parse_from_rfc3339(&submitted_at).unwrap()
    {
        return Err(RuntimeContractError::new(
            "nxrt-input-invalid",
            "deadlineAt must be later than submittedAt.",
            Some("deadlineAt"),
        ));
    }

    Ok(())
}

pub fn validate_cancellation_request(request: &CancellationRequest) -> RuntimeResult<()> {
    identifier(&request.request_id, "requestId")?;
    identifier(&request.execution_id, "executionId")?;
    digest(&request.work_package_digest, "workPackageDigest")?;
    digest(&request.authorization_digest, "authorizationDigest")?;
    digest(&request.reason_digest, "reasonDigest")?;
    timestamp(&request.requested_at, "requestedAt")?;
    Ok(())
}

pub fn validate_suspension_request(request: &SuspensionRequest) -> RuntimeResult<()> {
    identifier(&request.request_id, "requestId")?;
    identifier(&request.registration_id, "registrationId")?;
    digest(&request.authorization_digest, "authorizationDigest")?;
    digest(&request.reason_digest, "reasonDigest")?;
    timestamp(&request.requested_at, "requestedAt")?;
    Ok(())
}

fn registration_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<RegistrationReceipt> {
    let state: String = row.get(6)?;

    Ok(RegistrationReceipt {
        registration_id: row.get(0)?,
        external_agent_id: row.get(1)?,
        agent_version: row.get(2)?,
        manifest_digest: row.get(3)?,
        registry_record_digest: row.get(4)?,
        configuration_digest: row.get(5)?,
        state: RegistrationState::parse(&state).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(
                6,
                rusqlite::types::Type::Text,
                Box::new(error),
            )
        })?,
        registered_at: row.get(7)?,
        suspended_at: row.get(8)?,
        request_digest: row.get(9)?,
        execution_mode: EXECUTION_MODE,
        supports_real_execution: false,
    })
}

fn execution_from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<ExecutionRecord> {
    let budget_json: String = row.get(9)?;
    let state: String = row.get(12)?;

    let budget = serde_json::from_str::<ExecutionBudget>(&budget_json).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(9, rusqlite::types::Type::Text, Box::new(error))
    })?;

    Ok(ExecutionRecord {
        execution_id: row.get(0)?,
        request_id: row.get(1)?,
        idempotency_key: row.get(2)?,
        registration_id: row.get(3)?,
        work_package_digest: row.get(4)?,
        authorization_digest: row.get(5)?,
        manifest_digest: row.get(6)?,
        registry_record_digest: row.get(7)?,
        input_digest: row.get(8)?,
        budget,
        submitted_at: row.get(10)?,
        deadline_at: row.get(11)?,
        state: ExecutionState::parse(&state).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(
                12,
                rusqlite::types::Type::Text,
                Box::new(error),
            )
        })?,
        terminal: row.get::<_, i64>(13)? != 0,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
        request_digest: row.get(16)?,
        execution_mode: EXECUTION_MODE,
        supports_real_execution: false,
    })
}

fn load_registration(
    conn: &Connection,
    registration_id: &str,
) -> RuntimeResult<Option<RegistrationReceipt>> {
    conn.query_row(
        "SELECT registration_id, external_agent_id, agent_version, manifest_digest,
                registry_record_digest, configuration_digest, state, registered_at,
                suspended_at, request_digest
           FROM runtime_registrations
          WHERE registration_id = ?1",
        [registration_id],
        registration_from_row,
    )
    .optional()
    .map_err(database_error)
}

fn load_execution(conn: &Connection, execution_id: &str) -> RuntimeResult<Option<ExecutionRecord>> {
    conn.query_row(
        "SELECT execution_id, request_id, idempotency_key, registration_id,
                work_package_digest, authorization_digest, manifest_digest,
                registry_record_digest, input_digest, budget_json, submitted_at,
                deadline_at, state, terminal, created_at, updated_at, request_digest
           FROM runtime_executions
          WHERE execution_id = ?1",
        [execution_id],
        execution_from_row,
    )
    .optional()
    .map_err(database_error)
}

fn append_event(
    conn: &Connection,
    execution_id: &str,
    event_type: &str,
    occurred_at: &str,
    detail_digest: &str,
) -> RuntimeResult<RuntimeEvent> {
    let next_sequence: u64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sequence), 0) + 1
               FROM runtime_events
              WHERE execution_id = ?1",
            [execution_id],
            |row| row.get::<_, i64>(0).map(|value| value as u64),
        )
        .map_err(database_error)?;

    let material = serde_json::json!({
        "executionId": execution_id,
        "sequence": next_sequence,
        "eventType": event_type,
        "occurredAt": occurred_at,
        "detailDigest": detail_digest,
    });

    let content_hash = digest_json(&material)?;

    conn.execute(
        "INSERT INTO runtime_events (
            execution_id, sequence, event_type, occurred_at, detail_digest, content_hash
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            execution_id,
            next_sequence as i64,
            event_type,
            occurred_at,
            detail_digest,
            content_hash,
        ],
    )
    .map_err(database_error)?;

    Ok(RuntimeEvent {
        execution_id: execution_id.to_string(),
        sequence: next_sequence,
        event_type: event_type.to_string(),
        occurred_at: occurred_at.to_string(),
        detail_digest: detail_digest.to_string(),
        content_hash,
    })
}

pub fn register_agent(
    conn: &Connection,
    request: &RegistrationRequest,
) -> RuntimeResult<RegistrationReceipt> {
    validate_registration_request(request)?;
    let request_digest = digest_json(request)?;

    if let Some(existing) = load_registration(conn, &request.registration_id)? {
        if existing.request_digest == request_digest {
            return Ok(existing);
        }

        return Err(RuntimeContractError::new(
            "nxrt-registration-conflict",
            "Registration ID is already bound to different request bytes.",
            Some("registrationId"),
        ));
    }

    let external_conflict: Option<String> = conn
        .query_row(
            "SELECT registration_id
               FROM runtime_registrations
              WHERE external_agent_id = ?1 AND agent_version = ?2",
            params![request.external_agent_id, request.agent_version],
            |row| row.get(0),
        )
        .optional()
        .map_err(database_error)?;

    if external_conflict.is_some() {
        return Err(RuntimeContractError::new(
            "nxrt-registration-conflict",
            "External agent/version is already bound to a different registration.",
            Some("externalAgentId"),
        ));
    }

    conn.execute(
        "INSERT INTO runtime_registrations (
            registration_id, external_agent_id, agent_version, manifest_digest,
            registry_record_digest, configuration_digest, state, registered_at,
            suspended_at, request_digest
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'registered', ?7, NULL, ?8)",
        params![
            request.registration_id,
            request.external_agent_id,
            request.agent_version,
            request.manifest_digest,
            request.registry_record_digest,
            request.configuration_digest,
            timestamp(&request.registered_at, "registeredAt")?,
            request_digest,
        ],
    )
    .map_err(database_error)?;

    load_registration(conn, &request.registration_id)?.ok_or_else(|| {
        RuntimeContractError::new(
            "nxrt-provider-unavailable",
            "Registered runtime agent could not be reloaded.",
            Some("registration"),
        )
    })
}

pub fn submit(conn: &Connection, request: &SubmissionRequest) -> RuntimeResult<ExecutionRecord> {
    validate_submission_request(request)?;
    let request_digest = digest_json(request)?;

    let registration = load_registration(conn, &request.registration_id)?.ok_or_else(|| {
        RuntimeContractError::new(
            "nxrt-registration-not-found",
            "Runtime registration does not exist.",
            Some("registrationId"),
        )
    })?;

    if registration.state == RegistrationState::Suspended {
        return Err(RuntimeContractError::new(
            "nxrt-registration-suspended",
            "Runtime registration is suspended.",
            Some("registrationId"),
        ));
    }

    if registration.manifest_digest != request.manifest_digest
        || registration.registry_record_digest != request.registry_record_digest
    {
        return Err(RuntimeContractError::new(
            "nxrt-authorization-binding-invalid",
            "Submission does not match the exact registered manifest/registry binding.",
            Some("registrationId"),
        ));
    }

    let prior_execution: Option<(String, String)> = conn
        .query_row(
            "SELECT execution_id, request_digest
               FROM runtime_executions
              WHERE idempotency_key = ?1",
            [request.idempotency_key.as_str()],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(database_error)?;

    if let Some((execution_id, prior_digest)) = prior_execution {
        if prior_digest == request_digest {
            return load_execution(conn, &execution_id)?.ok_or_else(|| {
                RuntimeContractError::new(
                    "nxrt-provider-unavailable",
                    "Idempotent execution record is missing.",
                    Some("executionId"),
                )
            });
        }

        return Err(RuntimeContractError::new(
            "nxrt-idempotency-conflict",
            "Idempotency key is already bound to different submission bytes.",
            Some("idempotencyKey"),
        ));
    }

    let execution_id = format!("nxexec-{}", &request_digest[..24]);
    let submitted_at = timestamp(&request.submitted_at, "submittedAt")?;
    let deadline_at = timestamp(&request.deadline_at, "deadlineAt")?;
    let budget_json = serde_json::to_string(&request.budget).map_err(serialization_error)?;

    conn.execute(
        "INSERT INTO runtime_executions (
            execution_id, request_id, idempotency_key, registration_id,
            work_package_digest, authorization_digest, manifest_digest,
            registry_record_digest, input_digest, budget_json, submitted_at,
            deadline_at, state, terminal, created_at, updated_at, request_digest
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
            'accepted', 0, ?11, ?11, ?13
        )",
        params![
            execution_id,
            request.request_id,
            request.idempotency_key,
            request.registration_id,
            request.work_package_digest,
            request.authorization_digest,
            request.manifest_digest,
            request.registry_record_digest,
            request.input_digest,
            budget_json,
            submitted_at,
            deadline_at,
            request_digest,
        ],
    )
    .map_err(database_error)?;

    append_event(
        conn,
        &execution_id,
        "execution.accepted",
        &submitted_at,
        &request_digest,
    )?;

    load_execution(conn, &execution_id)?.ok_or_else(|| {
        RuntimeContractError::new(
            "nxrt-provider-unavailable",
            "New execution record could not be reloaded.",
            Some("executionId"),
        )
    })
}

pub fn inspect(conn: &Connection, execution_id: &str) -> RuntimeResult<ExecutionRecord> {
    identifier(execution_id, "executionId")?;

    load_execution(conn, execution_id)?.ok_or_else(|| {
        RuntimeContractError::new(
            "nxrt-execution-not-found",
            format!("Execution '{execution_id}' does not exist."),
            Some("executionId"),
        )
    })
}

pub fn events(
    conn: &Connection,
    execution_id: &str,
    after_sequence: u64,
    max_events: usize,
) -> RuntimeResult<EventBatch> {
    identifier(execution_id, "executionId")?;

    if max_events == 0 || max_events > MAX_EVENT_BATCH {
        return Err(RuntimeContractError::new(
            "nxrt-event-bound-exceeded",
            format!("maxEvents must be from 1 through {MAX_EVENT_BATCH}."),
            Some("maxEvents"),
        ));
    }

    inspect(conn, execution_id)?;

    let mut statement = conn
        .prepare(
            "SELECT execution_id, sequence, event_type, occurred_at, detail_digest, content_hash
               FROM runtime_events
              WHERE execution_id = ?1 AND sequence > ?2
              ORDER BY sequence ASC
              LIMIT ?3",
        )
        .map_err(database_error)?;

    let rows = statement
        .query_map(
            params![execution_id, after_sequence as i64, max_events as i64],
            |row| {
                Ok(RuntimeEvent {
                    execution_id: row.get(0)?,
                    sequence: row.get::<_, i64>(1)? as u64,
                    event_type: row.get(2)?,
                    occurred_at: row.get(3)?,
                    detail_digest: row.get(4)?,
                    content_hash: row.get(5)?,
                })
            },
        )
        .map_err(database_error)?;

    let event_list = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(database_error)?;

    Ok(EventBatch {
        execution_id: execution_id.to_string(),
        after_sequence,
        max_events,
        events: event_list,
    })
}

fn load_control_receipt(
    conn: &Connection,
    operation: &str,
    request_id: &str,
) -> RuntimeResult<Option<ControlReceipt>> {
    let serialized: Option<String> = conn
        .query_row(
            "SELECT receipt_json
               FROM runtime_control_receipts
              WHERE operation = ?1 AND request_id = ?2",
            params![operation, request_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(database_error)?;

    serialized
        .map(|value| serde_json::from_str(&value).map_err(serialization_error))
        .transpose()
}

fn persist_control_receipt(conn: &Connection, receipt: &ControlReceipt) -> RuntimeResult<()> {
    let serialized = serde_json::to_string(receipt).map_err(serialization_error)?;

    conn.execute(
        "INSERT INTO runtime_control_receipts (
            receipt_id, operation, request_id, request_digest, receipt_json
        ) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            receipt.receipt_id,
            receipt.operation,
            receipt.request_id,
            receipt.request_digest,
            serialized,
        ],
    )
    .map_err(database_error)?;

    Ok(())
}

pub fn cancel(
    conn: &Connection,
    request: &CancellationRequest,
) -> RuntimeResult<CancellationReceipt> {
    validate_cancellation_request(request)?;
    let request_digest = digest_json(request)?;

    if let Some(existing) = load_control_receipt(conn, "cancel", &request.request_id)? {
        if existing.request_digest != request_digest {
            return Err(RuntimeContractError::new(
                "nxrt-idempotency-conflict",
                "Cancellation request ID is already bound to different bytes.",
                Some("requestId"),
            ));
        }

        return Ok(CancellationReceipt {
            receipt_id: existing.receipt_id,
            execution_id: existing.execution_id.unwrap_or_default(),
            state: ExecutionState::parse(&existing.state)?,
            already_terminal: existing.already_terminal,
            acknowledged_at: existing.acknowledged_at,
            authorization_digest: existing.authorization_digest,
            content_hash: existing.content_hash,
        });
    }

    let execution = inspect(conn, &request.execution_id)?;

    if execution.work_package_digest != request.work_package_digest {
        return Err(RuntimeContractError::new(
            "nxrt-authorization-binding-invalid",
            "Cancellation work-package digest does not match the execution.",
            Some("workPackageDigest"),
        ));
    }

    let requested_at = timestamp(&request.requested_at, "requestedAt")?;
    let (new_state, already_terminal) = if execution.state.terminal() {
        (execution.state.clone(), true)
    } else if execution.state == ExecutionState::Running {
        (ExecutionState::RecoveryRequired, false)
    } else {
        (ExecutionState::Cancelled, false)
    };

    if !already_terminal {
        conn.execute(
            "UPDATE runtime_executions
                SET state = ?1, terminal = ?2, updated_at = ?3
              WHERE execution_id = ?4",
            params![
                new_state.as_str(),
                if new_state.terminal() { 1 } else { 0 },
                requested_at,
                request.execution_id,
            ],
        )
        .map_err(database_error)?;

        append_event(
            conn,
            &request.execution_id,
            if new_state == ExecutionState::RecoveryRequired {
                "execution.recovery-required"
            } else {
                "execution.cancelled"
            },
            &requested_at,
            &request_digest,
        )?;
    }

    let receipt_material = serde_json::json!({
        "operation": "cancel",
        "requestId": request.request_id,
        "requestDigest": request_digest,
        "executionId": request.execution_id,
        "state": new_state.as_str(),
        "alreadyTerminal": already_terminal,
        "acknowledgedAt": requested_at,
        "authorizationDigest": request.authorization_digest,
    });
    let content_hash = digest_json(&receipt_material)?;
    let receipt_id = format!("nxreceipt-{}", &content_hash[..24]);

    let stored = ControlReceipt {
        receipt_id: receipt_id.clone(),
        operation: "cancel".to_string(),
        request_id: request.request_id.clone(),
        request_digest,
        execution_id: Some(request.execution_id.clone()),
        registration_id: None,
        state: new_state.as_str().to_string(),
        already_terminal,
        acknowledged_at: requested_at.clone(),
        authorization_digest: request.authorization_digest.clone(),
        affected_execution_ids: Vec::new(),
        content_hash: content_hash.clone(),
    };

    persist_control_receipt(conn, &stored)?;

    Ok(CancellationReceipt {
        receipt_id,
        execution_id: request.execution_id.clone(),
        state: new_state,
        already_terminal,
        acknowledged_at: requested_at,
        authorization_digest: request.authorization_digest.clone(),
        content_hash,
    })
}

pub fn suspend_agent(
    conn: &Connection,
    request: &SuspensionRequest,
) -> RuntimeResult<SuspensionReceipt> {
    validate_suspension_request(request)?;
    let request_digest = digest_json(request)?;

    if let Some(existing) = load_control_receipt(conn, "suspend-agent", &request.request_id)? {
        if existing.request_digest != request_digest {
            return Err(RuntimeContractError::new(
                "nxrt-idempotency-conflict",
                "Suspension request ID is already bound to different bytes.",
                Some("requestId"),
            ));
        }

        return Ok(SuspensionReceipt {
            receipt_id: existing.receipt_id,
            registration_id: existing.registration_id.unwrap_or_default(),
            state: RegistrationState::Suspended,
            affected_execution_ids: existing.affected_execution_ids,
            acknowledged_at: existing.acknowledged_at,
            authorization_digest: existing.authorization_digest,
            content_hash: existing.content_hash,
        });
    }

    let registration = load_registration(conn, &request.registration_id)?.ok_or_else(|| {
        RuntimeContractError::new(
            "nxrt-registration-not-found",
            "Runtime registration does not exist.",
            Some("registrationId"),
        )
    })?;

    let requested_at = timestamp(&request.requested_at, "requestedAt")?;

    if registration.state != RegistrationState::Suspended {
        conn.execute(
            "UPDATE runtime_registrations
                SET state = 'suspended', suspended_at = ?1
              WHERE registration_id = ?2",
            params![requested_at, request.registration_id],
        )
        .map_err(database_error)?;
    }

    let mut statement = conn
        .prepare(
            "SELECT execution_id, state
               FROM runtime_executions
              WHERE registration_id = ?1 AND terminal = 0
              ORDER BY execution_id",
        )
        .map_err(database_error)?;

    let active = statement
        .query_map([request.registration_id.as_str()], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(database_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(database_error)?;

    let mut affected_execution_ids = Vec::new();

    for (execution_id, state) in active {
        let state = ExecutionState::parse(&state)?;
        let new_state = if state == ExecutionState::Running {
            ExecutionState::RecoveryRequired
        } else {
            ExecutionState::Suspended
        };

        conn.execute(
            "UPDATE runtime_executions
                SET state = ?1, terminal = ?2, updated_at = ?3
              WHERE execution_id = ?4",
            params![
                new_state.as_str(),
                if new_state.terminal() { 1 } else { 0 },
                requested_at,
                execution_id,
            ],
        )
        .map_err(database_error)?;

        append_event(
            conn,
            &execution_id,
            if new_state == ExecutionState::RecoveryRequired {
                "execution.recovery-required"
            } else {
                "execution.suspended"
            },
            &requested_at,
            &request_digest,
        )?;

        affected_execution_ids.push(execution_id);
    }

    affected_execution_ids.sort();

    let receipt_material = serde_json::json!({
        "operation": "suspend-agent",
        "requestId": request.request_id,
        "requestDigest": request_digest,
        "registrationId": request.registration_id,
        "affectedExecutionIds": affected_execution_ids,
        "acknowledgedAt": requested_at,
        "authorizationDigest": request.authorization_digest,
    });
    let content_hash = digest_json(&receipt_material)?;
    let receipt_id = format!("nxreceipt-{}", &content_hash[..24]);

    let stored = ControlReceipt {
        receipt_id: receipt_id.clone(),
        operation: "suspend-agent".to_string(),
        request_id: request.request_id.clone(),
        request_digest,
        execution_id: None,
        registration_id: Some(request.registration_id.clone()),
        state: "suspended".to_string(),
        already_terminal: false,
        acknowledged_at: requested_at.clone(),
        authorization_digest: request.authorization_digest.clone(),
        affected_execution_ids: affected_execution_ids.clone(),
        content_hash: content_hash.clone(),
    };

    persist_control_receipt(conn, &stored)?;

    Ok(SuspensionReceipt {
        receipt_id,
        registration_id: request.registration_id.clone(),
        state: RegistrationState::Suspended,
        affected_execution_ids,
        acknowledged_at: requested_at,
        authorization_digest: request.authorization_digest.clone(),
        content_hash,
    })
}

pub fn evidence(
    conn: &Connection,
    execution_id: &str,
    collected_at: &str,
    max_events: usize,
) -> RuntimeResult<EvidenceBundle> {
    let execution = inspect(conn, execution_id)?;

    if !execution.state.terminal() {
        return Err(RuntimeContractError::new(
            "nxrt-state-invalid",
            "Evidence may be collected only for a terminal execution.",
            Some("execution.state"),
        ));
    }

    let event_count: usize = conn
        .query_row(
            "SELECT COUNT(*) FROM runtime_events WHERE execution_id = ?1",
            [execution_id],
            |row| row.get::<_, i64>(0).map(|value| value as usize),
        )
        .map_err(database_error)?;

    if max_events == 0 || max_events > MAX_EVENT_BATCH || event_count > max_events {
        return Err(RuntimeContractError::new(
            "nxrt-event-bound-exceeded",
            format!(
                "Evidence requires {event_count} event(s), exceeding maxEvents={max_events} or the protocol bound."
            ),
            Some("maxEvents"),
        ));
    }

    let batch = events(conn, execution_id, 0, max_events)?;
    let collected_at = timestamp(collected_at, "collectedAt")?;
    let event_digests = batch
        .events
        .iter()
        .map(|event| event.content_hash.clone())
        .collect::<Vec<_>>();

    let material = serde_json::json!({
        "executionId": execution.execution_id,
        "workPackageDigest": execution.work_package_digest,
        "authorizationDigest": execution.authorization_digest,
        "manifestDigest": execution.manifest_digest,
        "registryRecordDigest": execution.registry_record_digest,
        "inputDigest": execution.input_digest,
        "requestDigest": execution.request_digest,
        "terminalState": execution.state.as_str(),
        "eventDigests": event_digests,
        "collectedAt": collected_at,
        "protocol": PROTOCOL,
        "protocolVersion": PROTOCOL_VERSION,
        "build": build_identity(),
        "executionMode": EXECUTION_MODE,
        "supportsRealExecution": false,
    });

    let evidence_digest = digest_json(&material)?;
    let evidence_id = format!("nxevidence-{}", &evidence_digest[..24]);

    Ok(EvidenceBundle {
        evidence_id,
        execution_id: execution.execution_id,
        work_package_digest: execution.work_package_digest,
        authorization_digest: execution.authorization_digest,
        manifest_digest: execution.manifest_digest,
        registry_record_digest: execution.registry_record_digest,
        input_digest: execution.input_digest,
        request_digest: execution.request_digest,
        terminal_state: execution.state,
        events: batch.events,
        event_digests,
        collected_at,
        protocol: PROTOCOL,
        protocol_version: PROTOCOL_VERSION,
        build: build_identity(),
        execution_mode: EXECUTION_MODE,
        supports_real_execution: false,
        evidence_digest,
    })
}

pub fn health(conn: &Connection) -> RuntimeResult<Health> {
    conn.query_row("SELECT 1", [], |_| Ok(()))
        .map_err(database_error)?;

    let registration_count = conn
        .query_row("SELECT COUNT(*) FROM runtime_registrations", [], |row| {
            row.get::<_, i64>(0).map(|value| value as u64)
        })
        .map_err(database_error)?;

    let execution_count = conn
        .query_row("SELECT COUNT(*) FROM runtime_executions", [], |row| {
            row.get::<_, i64>(0).map(|value| value as u64)
        })
        .map_err(database_error)?;

    Ok(Health {
        state: "degraded",
        protocol: PROTOCOL,
        protocol_version: PROTOCOL_VERSION,
        build: build_identity(),
        database_available: true,
        registration_count,
        execution_count,
        execution_mode: EXECUTION_MODE,
        supports_real_execution: false,
        checked_at: Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
    })
}

#[cfg(test)]
pub fn set_execution_state_for_test(
    conn: &Connection,
    execution_id: &str,
    state: ExecutionState,
    occurred_at: &str,
) -> RuntimeResult<()> {
    inspect(conn, execution_id)?;
    let occurred_at = timestamp(occurred_at, "occurredAt")?;

    conn.execute(
        "UPDATE runtime_executions
            SET state = ?1, terminal = ?2, updated_at = ?3
          WHERE execution_id = ?4",
        params![
            state.as_str(),
            if state.terminal() { 1 } else { 0 },
            occurred_at,
            execution_id,
        ],
    )
    .map_err(database_error)?;

    append_event(
        conn,
        execution_id,
        match state {
            ExecutionState::Running => "execution.started",
            ExecutionState::Succeeded => "execution.completed",
            ExecutionState::Failed => "execution.failed",
            ExecutionState::Cancelled => "execution.cancelled",
            ExecutionState::Suspended => "execution.suspended",
            ExecutionState::TimedOut => "execution.timed-out",
            ExecutionState::RecoveryRequired => "execution.recovery-required",
            ExecutionState::Accepted => "execution.accepted",
        },
        &occurred_at,
        &hash_bytes(state.as_str().as_bytes()),
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use tempfile::TempDir;

    fn connection() -> (TempDir, Connection) {
        let temp = TempDir::new().unwrap();
        let conn = db::open_db(temp.path()).unwrap();
        db::migrate(&conn).unwrap();
        (temp, conn)
    }

    fn registration() -> RegistrationRequest {
        RegistrationRequest {
            registration_id: "registration-1".into(),
            external_agent_id: "egov-agent-architect".into(),
            agent_version: "1.0.0".into(),
            manifest_digest: "a".repeat(64),
            registry_record_digest: "b".repeat(64),
            configuration_digest: "c".repeat(64),
            registered_at: "2026-08-07T06:00:00.000Z".into(),
        }
    }

    fn submission() -> SubmissionRequest {
        SubmissionRequest {
            request_id: "submission-1".into(),
            idempotency_key: "submission-key-1".into(),
            registration_id: "registration-1".into(),
            work_package_digest: "d".repeat(64),
            authorization_digest: "e".repeat(64),
            manifest_digest: "a".repeat(64),
            registry_record_digest: "b".repeat(64),
            input_digest: "f".repeat(64),
            budget: ExecutionBudget {
                max_cost_usd: 10.0,
                timeout_ms: 60_000,
                max_retries: 2,
                max_concurrency: 1,
            },
            submitted_at: "2026-08-07T06:01:00.000Z".into(),
            deadline_at: "2026-08-07T06:10:00.000Z".into(),
        }
    }

    fn cancellation(execution_id: &str, request_id: &str) -> CancellationRequest {
        CancellationRequest {
            request_id: request_id.into(),
            execution_id: execution_id.into(),
            work_package_digest: "d".repeat(64),
            authorization_digest: "9".repeat(64),
            reason_digest: "8".repeat(64),
            requested_at: "2026-08-07T06:02:00.000Z".into(),
        }
    }

    fn suspension(request_id: &str) -> SuspensionRequest {
        SuspensionRequest {
            request_id: request_id.into(),
            registration_id: "registration-1".into(),
            authorization_digest: "7".repeat(64),
            reason_digest: "6".repeat(64),
            requested_at: "2026-08-07T06:02:30.000Z".into(),
        }
    }

    #[test]
    fn exact_protocol_envelope_is_stable() {
        let envelope = success_envelope(serde_json::json!({"value": 1}));
        assert_eq!(envelope.protocol, "nexus-runtime");
        assert_eq!(envelope.protocol_version, "1.0.0");
        assert_eq!(envelope.build.crate_version, env!("CARGO_PKG_VERSION"));
    }

    #[test]
    fn registration_is_exactly_idempotent() {
        let (_temp, conn) = connection();
        let request = registration();
        let first = register_agent(&conn, &request).unwrap();
        let second = register_agent(&conn, &request).unwrap();
        assert_eq!(first.request_digest, second.request_digest);
    }

    #[test]
    fn registration_conflict_fails_closed() {
        let (_temp, conn) = connection();
        let request = registration();
        register_agent(&conn, &request).unwrap();
        let mut changed = request.clone();
        changed.configuration_digest = "d".repeat(64);
        let error = register_agent(&conn, &changed).unwrap_err();
        assert_eq!(error.code, "nxrt-registration-conflict");
    }

    #[test]
    fn submission_is_idempotent() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let request = submission();
        let first = submit(&conn, &request).unwrap();
        let second = submit(&conn, &request).unwrap();
        assert_eq!(first.execution_id, second.execution_id);
        assert_eq!(first.state, ExecutionState::Accepted);
    }

    #[test]
    fn submission_idempotency_conflict_fails_closed() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let request = submission();
        submit(&conn, &request).unwrap();
        let mut changed = request.clone();
        changed.input_digest = "1".repeat(64);
        let error = submit(&conn, &changed).unwrap_err();
        assert_eq!(error.code, "nxrt-idempotency-conflict");
    }

    #[test]
    fn inspection_requires_exact_execution_id() {
        let (_temp, conn) = connection();
        let error = inspect(&conn, "nxexec-missing").unwrap_err();
        assert_eq!(error.code, "nxrt-execution-not-found");
    }

    #[test]
    fn events_are_ordered_and_bounded() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        let batch = events(&conn, &execution.execution_id, 0, 10).unwrap();
        assert_eq!(batch.events.len(), 1);
        assert_eq!(batch.events[0].sequence, 1);

        let error = events(&conn, &execution.execution_id, 0, MAX_EVENT_BATCH + 1).unwrap_err();
        assert_eq!(error.code, "nxrt-event-bound-exceeded");
    }

    #[test]
    fn accepted_execution_cancellation_is_durable_and_idempotent() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        let request = cancellation(&execution.execution_id, "cancel-1");
        let first = cancel(&conn, &request).unwrap();
        let second = cancel(&conn, &request).unwrap();
        assert_eq!(first.content_hash, second.content_hash);
        assert_eq!(first.state, ExecutionState::Cancelled);
    }

    #[test]
    fn repeated_cancellation_of_terminal_execution_reports_already_terminal() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        cancel(&conn, &cancellation(&execution.execution_id, "cancel-1")).unwrap();
        let second = cancel(&conn, &cancellation(&execution.execution_id, "cancel-2")).unwrap();
        assert!(second.already_terminal);
        assert_eq!(second.state, ExecutionState::Cancelled);
    }

    #[test]
    fn running_execution_cancellation_requires_recovery() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        set_execution_state_for_test(
            &conn,
            &execution.execution_id,
            ExecutionState::Running,
            "2026-08-07T06:01:30.000Z",
        )
        .unwrap();

        let receipt = cancel(
            &conn,
            &cancellation(&execution.execution_id, "cancel-running"),
        )
        .unwrap();
        assert_eq!(receipt.state, ExecutionState::RecoveryRequired);
    }

    #[test]
    fn registration_suspension_blocks_new_submission() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        suspend_agent(&conn, &suspension("suspend-1")).unwrap();
        let error = submit(&conn, &submission()).unwrap_err();
        assert_eq!(error.code, "nxrt-registration-suspended");
    }

    #[test]
    fn suspension_receipt_is_idempotent() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let request = suspension("suspend-1");
        let first = suspend_agent(&conn, &request).unwrap();
        let second = suspend_agent(&conn, &request).unwrap();
        assert_eq!(first.content_hash, second.content_hash);
        assert_eq!(first.state, RegistrationState::Suspended);
    }

    #[test]
    fn terminal_evidence_binds_execution_and_events() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        cancel(&conn, &cancellation(&execution.execution_id, "cancel-1")).unwrap();
        let bundle = evidence(
            &conn,
            &execution.execution_id,
            "2026-08-07T06:03:00.000Z",
            100,
        )
        .unwrap();

        assert_eq!(bundle.terminal_state, ExecutionState::Cancelled);
        assert_eq!(bundle.execution_id, execution.execution_id);
        assert!(!bundle.event_digests.is_empty());
        assert_eq!(bundle.execution_mode, "control-plane-only");
        assert!(!bundle.supports_real_execution);
    }

    #[test]
    fn evidence_rejects_nonterminal_execution() {
        let (_temp, conn) = connection();
        register_agent(&conn, &registration()).unwrap();
        let execution = submit(&conn, &submission()).unwrap();
        let error = evidence(
            &conn,
            &execution.execution_id,
            "2026-08-07T06:03:00.000Z",
            100,
        )
        .unwrap_err();
        assert_eq!(error.code, "nxrt-state-invalid");
    }

    #[test]
    fn health_truthfully_reports_control_plane_only() {
        let (_temp, conn) = connection();
        let report = health(&conn).unwrap();
        assert_eq!(report.state, "degraded");
        assert_eq!(report.execution_mode, "control-plane-only");
        assert!(!report.supports_real_execution);
        assert!(report.database_available);
    }
}
