use crate::error::{NexusError, Result};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::path::Path;

const MAX_PACKAGE: usize = 16 * 1024 * 1024;
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub version: String,
    pub source: String,
    pub wasm_path: Option<String>,
    pub description: Option<String>,
    pub installed_at: String,
}
#[derive(Debug, Deserialize)]
pub struct Release {
    pub name: String,
    pub version: String,
    pub sha256: String,
    pub size: usize,
    pub status: String,
    pub manifest: serde_json::Value,
}
#[derive(Deserialize)]
pub struct Catalog {
    pub items: Vec<Release>,
}

fn registry_error(message: &str) -> NexusError {
    NexusError::Other(message.into())
}
fn client() -> Result<reqwest::Client> {
    Ok(reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .redirect(reqwest::redirect::Policy::none())
        .build()?)
}
fn registry() -> Result<reqwest::Url> {
    let value =
        std::env::var("NEXUS_REGISTRY_URL").unwrap_or_else(|_| "https://aiagents.nexus".into());
    let url =
        reqwest::Url::parse(&value).map_err(|_| registry_error("Invalid NEXUS_REGISTRY_URL"))?;
    let loopback = matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"));
    if !(url.scheme() == "https" || (url.scheme() == "http" && loopback))
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
        || url.path() != "/"
    {
        return Err(registry_error(
            "Registry must be an HTTPS origin (HTTP is allowed only on loopback for development)",
        ));
    }
    Ok(url)
}
fn name_valid(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 64
        && name.as_bytes()[0].is_ascii_lowercase()
        && !name.ends_with('-')
        && !name.contains("--")
        && name
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}
fn version_valid(version: &str) -> bool {
    let parts: Vec<_> = version.split('.').collect();
    version.len() <= 32
        && parts.len() == 3
        && parts.iter().all(|p| {
            !p.is_empty()
                && (p.len() == 1 || !p.starts_with('0'))
                && p.bytes().all(|b| b.is_ascii_digit())
        })
}
async fn bounded(mut response: reqwest::Response, max: usize) -> Result<Vec<u8>> {
    if !response.status().is_success() {
        return Err(registry_error(&format!(
            "Registry returned HTTP {}",
            response.status()
        )));
    }
    if response.content_length().is_some_and(|n| n > max as u64) {
        return Err(registry_error("Registry response exceeds size limit"));
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        if bytes.len() + chunk.len() > max {
            return Err(registry_error("Registry response exceeds size limit"));
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}
pub async fn search_skills(query: &str) -> Result<Vec<Release>> {
    let url = registry()?
        .join("/api/marketplace/skills")
        .map_err(|e| registry_error(&e.to_string()))?;
    let bytes = bounded(
        client()?.get(url).query(&[("q", query)]).send().await?,
        2 * 1024 * 1024,
    )
    .await?;
    Ok(serde_json::from_slice::<Catalog>(&bytes)?.items)
}
pub async fn install_skill(conn: &Connection, root: &Path, spec: &str) -> Result<Skill> {
    let (name, version) = spec
        .split_once('@')
        .map_or((spec, None), |(n, v)| (n, Some(v)));
    if !name_valid(name) || version.is_some_and(|v| !version_valid(v)) {
        return Err(registry_error(
            "Use skill-name or skill-name@major.minor.patch",
        ));
    }
    let base = registry()?;
    let url = base
        .join(&format!(
            "/api/marketplace/skills/{name}{}",
            version.map(|v| format!("/{v}")).unwrap_or_default()
        ))
        .map_err(|e| registry_error(&e.to_string()))?;
    let http = client()?;
    let bytes = bounded(http.get(url).send().await?, 64 * 1024).await?;
    let release: Release = serde_json::from_slice(&bytes)?;
    if release.name != name
        || !version_valid(&release.version)
        || version.is_some_and(|v| v != release.version)
        || release.status != "approved"
        || release.manifest["pricing"] != "free"
        || release.manifest["runtime"] != "wasip1-command"
        || release.manifest["entrypoint"] != "_start"
        || release.manifest["schemaVersion"] != 1
        || release.manifest["name"] != name
        || release.manifest["version"] != release.version
        || release.size > MAX_PACKAGE
        || release.sha256.len() != 64
        || !release
            .sha256
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(registry_error("Invalid or unsupported registry manifest"));
    }
    let source = base
        .join(&format!(
            "/api/marketplace/skills/{name}/{}/package",
            release.version
        ))
        .map_err(|e| registry_error(&e.to_string()))?;
    let package = bounded(http.get(source.clone()).send().await?, MAX_PACKAGE).await?;
    if package.len() != release.size || format!("{:x}", Sha256::digest(&package)) != release.sha256
    {
        return Err(registry_error(
            "Package SHA-256 or size mismatch; nothing installed",
        ));
    }
    let dir = root.join("skills").join(name).join(&release.version);
    std::fs::create_dir_all(&dir)?;
    let target = dir.join(format!("{}.wasm", release.sha256));
    // create_new and atomic rename avoid partially installed modules on interruption.
    let temporary = dir.join(format!(".{}.tmp", uuid::Uuid::new_v4()));
    let result = (|| -> Result<()> {
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        file.write_all(&package)?;
        file.sync_all()?;
        drop(file);
        crate::wasm::validate_wasm(&temporary)?;
        std::fs::rename(&temporary, &target)?;
        Ok(())
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(&temporary);
    }
    result?;
    let skill = Skill {
        name: name.into(),
        version: release.version,
        source: source.to_string(),
        wasm_path: Some(target.canonicalize()?.to_string_lossy().into_owned()),
        description: release.manifest["description"].as_str().map(String::from),
        installed_at: chrono::Utc::now().to_rfc3339(),
    };
    conn.execute("INSERT INTO skills (name, version, source, wasm_path, description, installed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(name) DO UPDATE SET version=excluded.version, source=excluded.source, wasm_path=excluded.wasm_path, description=excluded.description, installed_at=excluded.installed_at", rusqlite::params![skill.name, skill.version, skill.source, skill.wasm_path, skill.description, skill.installed_at])?;
    Ok(skill)
}

pub async fn publish_skill(path: &Path) -> Result<serde_json::Value> {
    let token = std::env::var("NEXUS_REGISTRY_TOKEN").map_err(|_| registry_error("Set NEXUS_REGISTRY_TOKEN to a current Clerk session token, or upload from the developer portal"))?;
    let mut manifest = String::new();
    std::fs::File::open(path.join("manifest.json"))?
        .take(25001)
        .read_to_string(&mut manifest)?;
    if manifest.len() > 25000 {
        return Err(registry_error("Manifest too large"));
    }
    let _: serde_json::Value = serde_json::from_str(&manifest)?;
    let mut bytes = Vec::new();
    std::fs::File::open(path.join("skill.wasm"))?
        .take((MAX_PACKAGE + 1) as u64)
        .read_to_end(&mut bytes)?;
    if bytes.len() > MAX_PACKAGE {
        return Err(registry_error("Package exceeds 16 MiB"));
    }
    let form = reqwest::multipart::Form::new()
        .text("manifest", manifest)
        .part(
            "wasm",
            reqwest::multipart::Part::bytes(bytes)
                .file_name("skill.wasm")
                .mime_str("application/wasm")?,
        );
    let url = registry()?
        .join("/api/marketplace/publish")
        .map_err(|e| registry_error(&e.to_string()))?;
    let bytes = bounded(
        client()?
            .post(url)
            .bearer_auth(token)
            .multipart(form)
            .send()
            .await?,
        64 * 1024,
    )
    .await?;
    let response: serde_json::Value = serde_json::from_slice(&bytes)?;
    if response["status"] != "pending" {
        return Err(registry_error("Unexpected registry submission response"));
    }
    Ok(response)
}

/// List installed skills.
pub fn list_skills(conn: &Connection) -> Result<Vec<Skill>> {
    let mut stmt = conn.prepare(
        "SELECT name, version, source, wasm_path, description, installed_at FROM skills ORDER BY name",
    )?;
    let skills = stmt
        .query_map([], |row| {
            Ok(Skill {
                name: row.get(0)?,
                version: row.get(1)?,
                source: row.get(2)?,
                wasm_path: row.get(3)?,
                description: row.get(4)?,
                installed_at: row.get(5)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    Ok(skills)
}
