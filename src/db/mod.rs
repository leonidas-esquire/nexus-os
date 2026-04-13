use crate::error::Result;
use rusqlite::Connection;
use std::path::Path;

/// Open (or create) the project database at `data/nexus.db` within the project directory.
pub fn open_db(project_dir: &Path) -> Result<Connection> {
    let data_dir = project_dir.join("data");
    std::fs::create_dir_all(&data_dir)?;
    let db_path = data_dir.join("nexus.db");
    let conn = Connection::open(&db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}

/// Run all schema migrations.
pub fn migrate(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS agents (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            template    TEXT,
            source      TEXT,
            status      TEXT NOT NULL DEFAULT 'stopped',
            pid         INTEGER,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS supervisors (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            strategy    TEXT NOT NULL DEFAULT 'one-for-one',
            max_restarts INTEGER NOT NULL DEFAULT 3,
            restart_window INTEGER NOT NULL DEFAULT 60,
            status      TEXT NOT NULL DEFAULT 'stopped',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS supervisor_children (
            supervisor_id TEXT NOT NULL,
            agent_name    TEXT NOT NULL,
            position      INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (supervisor_id, agent_name),
            FOREIGN KEY (supervisor_id) REFERENCES supervisors(id)
        );

        CREATE TABLE IF NOT EXISTS sagas (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            status      TEXT NOT NULL DEFAULT 'pending',
            current_step INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS saga_steps (
            saga_id     TEXT NOT NULL,
            step_index  INTEGER NOT NULL,
            name        TEXT NOT NULL,
            action      TEXT NOT NULL,
            compensate  TEXT,
            status      TEXT NOT NULL DEFAULT 'pending',
            PRIMARY KEY (saga_id, step_index),
            FOREIGN KEY (saga_id) REFERENCES sagas(id)
        );

        CREATE TABLE IF NOT EXISTS workflows (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS workflow_steps (
            workflow_id TEXT NOT NULL,
            step_index  INTEGER NOT NULL,
            name        TEXT NOT NULL,
            command     TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'pending',
            output      TEXT,
            PRIMARY KEY (workflow_id, step_index),
            FOREIGN KEY (workflow_id) REFERENCES workflows(id)
        );

        CREATE TABLE IF NOT EXISTS pools (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL UNIQUE,
            strategy    TEXT NOT NULL DEFAULT 'round-robin',
            status      TEXT NOT NULL DEFAULT 'stopped',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS pool_members (
            pool_id     TEXT NOT NULL,
            agent_name  TEXT NOT NULL,
            PRIMARY KEY (pool_id, agent_name),
            FOREIGN KEY (pool_id) REFERENCES pools(id)
        );

        CREATE TABLE IF NOT EXISTS cost_budgets (
            agent_name  TEXT PRIMARY KEY,
            budget_cents INTEGER NOT NULL,
            period      TEXT NOT NULL DEFAULT 'day',
            alert_at    INTEGER DEFAULT 80,
            action      TEXT DEFAULT 'alert',
            spent_cents INTEGER NOT NULL DEFAULT 0,
            last_reset  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cost_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name  TEXT NOT NULL,
            amount_cents INTEGER NOT NULL,
            model       TEXT,
            tokens_in   INTEGER,
            tokens_out  INTEGER,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
            lamport     INTEGER NOT NULL DEFAULT 0,
            agent_name  TEXT,
            event_type  TEXT NOT NULL,
            detail      TEXT,
            content_hash TEXT
        );

        CREATE TABLE IF NOT EXISTS trust_records (
            agent_name  TEXT PRIMARY KEY,
            auid        TEXT,
            trust_tier  TEXT,
            t_score     INTEGER,
            credit_rating TEXT,
            verified_at TEXT,
            status      TEXT NOT NULL DEFAULT 'unverified'
        );

        CREATE TABLE IF NOT EXISTS broker_routes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            task        TEXT NOT NULL,
            handler     TEXT NOT NULL,
            handler_type TEXT NOT NULL,
            cost_cents  INTEGER DEFAULT 0,
            latency_ms  INTEGER DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS skills (
            name        TEXT PRIMARY KEY,
            version     TEXT NOT NULL,
            source      TEXT NOT NULL,
            wasm_path   TEXT,
            description TEXT,
            installed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS edge_deployments (
            agent_name  TEXT PRIMARY KEY,
            worker_name TEXT NOT NULL,
            region      TEXT,
            status      TEXT NOT NULL DEFAULT 'deploying',
            url         TEXT,
            deployed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_open_and_migrate() {
        let tmp = TempDir::new().unwrap();
        let conn = open_db(tmp.path()).unwrap();
        migrate(&conn).unwrap();

        // Verify tables exist
        let count: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='agents'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }
}
