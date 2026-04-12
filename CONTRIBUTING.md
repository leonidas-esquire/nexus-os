# Contributing to Nexus OS

Thank you for your interest in contributing to Nexus OS! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** — Treat everyone with respect and kindness.
- **Be constructive** — Provide helpful feedback and suggestions.
- **Be inclusive** — Welcome people of all backgrounds and experience levels.
- **Be patient** — Remember that everyone is learning.

Unacceptable behavior includes harassment, discrimination, and personal attacks. Report violations to conduct@aiagents.nexus.

---

## Getting Started

### Prerequisites

- **Rust** (1.75 or later) — [Install Rust](https://rustup.rs/)
- **Git** — [Install Git](https://git-scm.com/)
- **SQLite** — Usually pre-installed on macOS/Linux

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/nexus-os.git
cd nexus-os
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/leonidas-esquire/nexus-os.git
```

4. Create a branch for your work:

```bash
git checkout -b feature/your-feature-name
```

---

## How to Contribute

### Reporting Bugs

Before reporting a bug:

1. Check existing [Issues](https://github.com/leonidas-esquire/nexus-os/issues) to avoid duplicates
2. Update to the latest version to see if the bug persists

When reporting a bug, include:

- **Description** — Clear description of the bug
- **Steps to Reproduce** — Minimal steps to reproduce the issue
- **Expected Behavior** — What you expected to happen
- **Actual Behavior** — What actually happened
- **Environment** — OS, Rust version, Nexus OS version
- **Logs** — Relevant error messages or logs

### Suggesting Features

We welcome feature suggestions! Open an issue with:

- **Problem** — What problem does this feature solve?
- **Solution** — How do you envision this feature working?
- **Alternatives** — Any alternative solutions you've considered?
- **Use Cases** — Who would benefit from this feature?

### Contributing Code

1. **Find an issue** — Look for issues labeled `good first issue` or `help wanted`
2. **Comment** — Let us know you're working on it
3. **Fork & Branch** — Create a feature branch
4. **Code** — Make your changes
5. **Test** — Add tests for your changes
6. **Document** — Update documentation if needed
7. **Submit** — Open a pull request

---

## Development Setup

### Build

```bash
# Debug build
cargo build

# Release build
cargo build --release

# Run locally
cargo run -- status
```

### Project Structure

```
nexus-os/
├── src/
│   ├── main.rs           # Entry point
│   ├── cli.rs            # CLI argument parsing
│   ├── commands.rs       # Command implementations
│   ├── store.rs          # SQLite database layer
│   ├── supervisor.rs     # Supervisor primitive
│   ├── saga.rs           # Saga primitive
│   ├── workflow.rs       # Workflow primitive
│   ├── pool.rs           # Pool primitive
│   ├── cost.rs           # Cost controller
│   ├── axis.rs           # AXIS Trust integration
│   ├── broker.rs         # Broker routing
│   ├── dashboard.rs      # Web dashboard
│   ├── edge.rs           # Cloudflare Edge deployment
│   └── wasm.rs           # WASM runtime
├── tests/                # Integration tests
├── examples/             # Example agents
├── docs/                 # Documentation
├── Cargo.toml            # Rust dependencies
├── LICENSE               # Apache 2.0 license
├── README.md             # Project readme
└── CONTRIBUTING.md       # This file
```

### Environment Variables

Create a `.env` file for local development:

```bash
# Optional — for AXIS Trust integration
AXIS_API_KEY=your_api_key

# Optional — for LLM fallback in broker
ANTHROPIC_API_KEY=your_api_key

# Optional — for edge deployment
CF_ACCOUNT_ID=your_account_id
CF_API_TOKEN=your_api_token
```

---

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`cargo build`)
- [ ] All tests pass (`cargo test`)
- [ ] Code is formatted (`cargo fmt`)
- [ ] Lints pass (`cargo clippy`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages are clear and descriptive

### Submitting a PR

1. Push your branch to your fork
2. Open a pull request against `main`
3. Fill out the PR template
4. Link related issues

### PR Title Format

Use conventional commit format:

```
feat: add new broker routing strategy
fix: resolve supervisor restart race condition
docs: update CLI reference for pools
test: add integration tests for sagas
refactor: simplify cost calculation logic
chore: update dependencies
```

### Review Process

1. A maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR

---

## Coding Standards

### Rust Style

- Follow the [Rust Style Guide](https://doc.rust-lang.org/nightly/style-guide/)
- Run `cargo fmt` before committing
- Run `cargo clippy` and address warnings
- Use meaningful variable and function names
- Add comments for complex logic

### Code Organization

```rust
// Good: Clear, descriptive names
pub async fn run_agent_with_supervision(
    agent: &Agent,
    supervisor: &Supervisor,
    config: &Config,
) -> Result<ExecutionResult> {
    // Implementation
}

// Bad: Unclear abbreviations
pub async fn run_ag_sup(a: &Ag, s: &Sup, c: &Cfg) -> Result<ExRes> {
    // Implementation
}
```

### Error Handling

```rust
// Good: Use Result and provide context
pub fn load_config(path: &Path) -> Result<Config> {
    let contents = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read config file: {}", path.display()))?;
    
    let config: Config = serde_yaml::from_str(&contents)
        .with_context(|| "Failed to parse config YAML")?;
    
    Ok(config)
}

// Bad: Unwrap or panic
pub fn load_config(path: &Path) -> Config {
    let contents = std::fs::read_to_string(path).unwrap();
    serde_yaml::from_str(&contents).unwrap()
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_supervisor_restart

# Run tests with output
cargo test -- --nocapture

# Run integration tests only
cargo test --test integration
```

### Writing Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_supervisor_one_for_one_restart() {
        // Arrange
        let supervisor = Supervisor::new("test", Strategy::OneForOne, 3);
        let agent = Agent::new("worker");
        supervisor.add_child(&agent);

        // Act
        let result = supervisor.handle_failure(&agent);

        // Assert
        assert!(result.is_ok());
        assert_eq!(supervisor.restart_count(&agent), 1);
    }

    #[tokio::test]
    async fn test_saga_rollback_on_failure() {
        // Async test implementation
    }
}
```

### Test Coverage

We aim for >80% test coverage on core functionality. Focus tests on:

- Happy path scenarios
- Error handling
- Edge cases
- Integration between components

---

## Documentation

### Code Documentation

```rust
/// Runs an agent under supervision with automatic restart on failure.
///
/// # Arguments
///
/// * `agent` - The agent to run
/// * `supervisor` - The supervisor managing this agent
/// * `config` - Runtime configuration
///
/// # Returns
///
/// Returns `Ok(ExecutionResult)` on success, or an error if the agent
/// fails and exceeds the maximum restart limit.
///
/// # Examples
///
/// ```
/// let result = run_agent_with_supervision(&agent, &supervisor, &config).await?;
/// println!("Agent completed with output: {:?}", result.output);
/// ```
pub async fn run_agent_with_supervision(
    agent: &Agent,
    supervisor: &Supervisor,
    config: &Config,
) -> Result<ExecutionResult> {
    // Implementation
}
```

### Documentation Site

If your changes affect user-facing functionality:

1. Update relevant docs in the `/docs` folder
2. Update the CLI reference if commands change
3. Add examples for new features

---

## Community

### Getting Help

- **Discord:** [discord.gg/nexus-os](https://discord.gg/nexus-os)
- **GitHub Discussions:** [Discussions](https://github.com/leonidas-esquire/nexus-os/discussions)
- **Stack Overflow:** Tag questions with `nexus-os`

### Office Hours

We hold weekly office hours for contributors:

- **When:** Thursdays at 10am PT
- **Where:** Discord voice channel
- **What:** Q&A, code review, planning

### Recognition

Contributors are recognized in:

- The project README
- Release notes
- Our website's contributors page

---

## License

By contributing to Nexus OS, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

Thank you for contributing to Nexus OS! 🚀
