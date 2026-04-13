use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    pub agent_name: String,
    pub budget_cents: i64,
    pub period: String,
    pub alert_at: Option<i32>,
    pub action: Option<String>,
    pub spent_cents: i64,
    pub last_reset: String,
}

/// Parse a budget string like "$10/day" into cents and period.
pub fn parse_budget(budget_str: &str) -> Result<(i64, String)> {
    let s = budget_str.trim().trim_start_matches('$');
    let parts: Vec<&str> = s.split('/').collect();
    if parts.len() != 2 {
        return Err(NexusError::Cost(format!(
            "Invalid budget format '{}'. Use: $10/day, $100/month",
            budget_str
        )));
    }
    let amount: f64 = parts[0]
        .parse()
        .map_err(|_| NexusError::Cost(format!("Invalid amount: {}", parts[0])))?;
    let period = parts[1].to_string();
    if !["day", "week", "month"].contains(&period.as_str()) {
        return Err(NexusError::Cost(format!(
            "Invalid period '{}'. Use: day, week, month",
            period
        )));
    }
    Ok(((amount * 100.0) as i64, period))
}

pub fn set_budget(
    conn: &Connection,
    agent_name: &str,
    budget_str: &str,
    alert_at: Option<u32>,
    action: Option<&str>,
) -> Result<Budget> {
    let (cents, period) = parse_budget(budget_str)?;
    let alert = alert_at.map(|a| a as i32).unwrap_or(80);
    let act = action.unwrap_or("alert").to_string();

    conn.execute(
        "INSERT OR REPLACE INTO cost_budgets (agent_name, budget_cents, period, alert_at, action, spent_cents) VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        rusqlite::params![agent_name, cents, period, alert, act],
    )?;

    Ok(Budget {
        agent_name: agent_name.to_string(),
        budget_cents: cents,
        period,
        alert_at: Some(alert),
        action: Some(act),
        spent_cents: 0,
        last_reset: chrono::Utc::now().to_rfc3339(),
    })
}

pub fn record_cost(
    conn: &Connection,
    agent_name: &str,
    amount_cents: i64,
    model: Option<&str>,
    tokens_in: Option<i64>,
    tokens_out: Option<i64>,
) -> Result<()> {
    conn.execute(
        "INSERT INTO cost_events (agent_name, amount_cents, model, tokens_in, tokens_out) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![agent_name, amount_cents, model, tokens_in, tokens_out],
    )?;
    conn.execute(
        "UPDATE cost_budgets SET spent_cents = spent_cents + ?1 WHERE agent_name = ?2",
        rusqlite::params![amount_cents, agent_name],
    )?;
    Ok(())
}

pub fn list_budgets(conn: &Connection) -> Result<Vec<Budget>> {
    let mut stmt = conn.prepare(
        "SELECT agent_name, budget_cents, period, alert_at, action, spent_cents, last_reset FROM cost_budgets ORDER BY agent_name",
    )?;
    let budgets = stmt
        .query_map([], |row| {
            Ok(Budget {
                agent_name: row.get(0)?,
                budget_cents: row.get(1)?,
                period: row.get(2)?,
                alert_at: row.get(3)?,
                action: row.get(4)?,
                spent_cents: row.get(5)?,
                last_reset: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(budgets)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_budget() {
        let (cents, period) = parse_budget("$10/day").unwrap();
        assert_eq!(cents, 1000);
        assert_eq!(period, "day");

        let (cents, period) = parse_budget("$0.50/month").unwrap();
        assert_eq!(cents, 50);
        assert_eq!(period, "month");
    }

    #[test]
    fn test_parse_budget_invalid() {
        assert!(parse_budget("10").is_err());
        assert!(parse_budget("$10/year").is_err());
    }
}
