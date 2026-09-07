//! Deterministic WASIp1 task: validate records and sum integer cents.
//! Reads JSON on stdin and writes JSON on stdout. No LLM or network code.
use serde::Deserialize;
use std::collections::HashSet;
use std::io::{self, Read};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Request {
    records: Vec<Record>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Record {
    id: String,
    amount_cents: u64,
}

fn run() -> Result<serde_json::Value, String> {
    let mut input = String::new();
    io::stdin()
        .take(1_048_577)
        .read_to_string(&mut input)
        .map_err(|e| e.to_string())?;
    if input.len() > 1_048_576 {
        return Err("input exceeds 1 MiB".into());
    }
    let request: Request = serde_json::from_str(&input).map_err(|e| e.to_string())?;
    let mut ids = HashSet::new();
    let mut total = 0u64;
    for record in &request.records {
        if record.id.trim().is_empty() {
            return Err("record id must not be empty".into());
        }
        if !ids.insert(&record.id) {
            return Err(format!("duplicate record id: {}", record.id));
        }
        total = total
            .checked_add(record.amount_cents)
            .ok_or("total exceeds u64 capacity")?;
    }
    Ok(
        serde_json::json!({"valid": true, "record_count": request.records.len(), "total_cents": total}),
    )
}

fn main() {
    match run() {
        Ok(result) => println!("{result}"),
        Err(error) => {
            eprintln!("{}", serde_json::json!({"valid": false, "error": error}));
            std::process::exit(2);
        }
    }
}
