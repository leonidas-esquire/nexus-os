use crate::broker as b;
use crate::error::Result;
use super::{open_project_db, success};
use colored::Colorize;

pub async fn route(task: &str) -> Result<()> {
    let conn = open_project_db()?;
    let decision = b::route_task(&conn, task)?;

    println!("  Task:       {}", task);
    println!("  Handler:    {}", decision.handler.bright_cyan());
    println!("  Type:       {}", decision.handler_type);
    println!("  Confidence: {:.0}%", decision.confidence * 100.0);
    println!("  Est. cost:  ${:.4}", decision.estimated_cost_cents as f64 / 100.0);
    println!("  Est. latency: {}ms", decision.estimated_latency_ms);

    Ok(())
}

pub async fn execute(task: &str) -> Result<()> {
    let conn = open_project_db()?;
    let decision = b::route_task(&conn, task)?;
    b::record_route(&conn, &decision)?;

    success(&format!(
        "Routed to {} ({}) — cost: ${:.4}, latency: ~{}ms",
        decision.handler.bright_cyan(),
        decision.handler_type,
        decision.estimated_cost_cents as f64 / 100.0,
        decision.estimated_latency_ms
    ));

    Ok(())
}

pub async fn stats() -> Result<()> {
    let conn = open_project_db()?;
    let stats = b::get_stats(&conn)?;

    println!("  Total routes: {}", stats.total_routes);
    println!("  Skill:        {}", stats.skill_routes);
    println!("  WASM:         {}", stats.wasm_routes);
    println!("  LLM:          {}", stats.llm_routes);
    println!("  Total cost:   ${:.2}", stats.total_cost_cents as f64 / 100.0);

    if stats.total_routes > 0 {
        let savings = ((stats.skill_routes + stats.wasm_routes) as f64 / stats.total_routes as f64) * 100.0;
        println!("  Cost savings: {:.0}% (skill+WASM vs all-LLM)", savings);
    }

    Ok(())
}
