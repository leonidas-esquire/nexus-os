use crate::audit;
use crate::cost as c;
use crate::error::Result;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn set(agent: &str, budget: &str, alert_at: Option<u32>, action: Option<&str>) -> Result<()> {
    let conn = open_project_db()?;
    let b = c::set_budget(&conn, agent, budget, alert_at, action)?;
    audit::log_event(&conn, Some(agent), "cost.budget_set", Some(&format!("budget={} period={}", budget, b.period)))?;
    success(&format!(
        "Budget set for '{}': ${:.2}/{} (alert at {}%, action: {})",
        agent.bright_cyan(),
        b.budget_cents as f64 / 100.0,
        b.period,
        b.alert_at.unwrap_or(80),
        b.action.unwrap_or_else(|| "alert".to_string())
    ));
    Ok(())
}

pub async fn status() -> Result<()> {
    let conn = open_project_db()?;
    let budgets = c::list_budgets(&conn)?;
    if budgets.is_empty() {
        println!("  No cost budgets configured. Use `naos cost set <agent> --budget $10/day`.");
        return Ok(());
    }
    for b in budgets {
        let pct = if b.budget_cents > 0 {
            (b.spent_cents as f64 / b.budget_cents as f64) * 100.0
        } else {
            0.0
        };
        let bar_width = 20;
        let filled = ((pct / 100.0) * bar_width as f64).min(bar_width as f64) as usize;
        let bar = format!("[{}{}]", "█".repeat(filled), "░".repeat(bar_width - filled));

        let pct_str = if pct >= 80.0 {
            format!("{:.0}%", pct).red().to_string()
        } else if pct >= 50.0 {
            format!("{:.0}%", pct).yellow().to_string()
        } else {
            format!("{:.0}%", pct).green().to_string()
        };

        println!(
            "  {} ${:.2}/${:.2} {} {} {}",
            b.agent_name.bright_cyan(),
            b.spent_cents as f64 / 100.0,
            b.budget_cents as f64 / 100.0,
            b.period,
            bar,
            pct_str
        );
    }
    Ok(())
}
