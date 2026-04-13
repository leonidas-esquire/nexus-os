use crate::dashboard;
use crate::error::Result;
use super::{project_root, success, info};
use colored::Colorize;

pub async fn run(port: u16, open_browser: bool) -> Result<()> {
    let root = project_root()?;
    let url = format!("http://localhost:{}", port);

    success(&format!("Dashboard starting at {}", url.bright_cyan()));
    info("Press Ctrl+C to stop.");

    if open_browser {
        let _ = open::that(&url);
    }

    dashboard::serve(port, root).await
}
