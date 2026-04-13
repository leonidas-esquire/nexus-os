use clap::{Parser, Subcommand};
use naos::cli;

#[derive(Parser)]
#[command(
    name = "naos",
    version,
    about = "Nexus OS — The orchestration layer for AI agents",
    long_about = "One CLI to create, supervise, and scale AI agents.\nBuilt in Rust. WASM-sandboxed. Erlang-style fault tolerance."
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new Nexus OS project
    Init {
        /// Project name (also used as directory name)
        name: String,
    },

    /// Create a new agent
    Create {
        /// Agent name
        name: String,

        /// Agent template
        #[arg(short, long, default_value = "echo")]
        template: String,
    },

    /// Run an agent
    Run {
        /// Agent name
        name: String,
    },

    /// Stop a running agent
    Stop {
        /// Agent name
        name: String,
    },

    /// Show status of all agents
    Status,

    /// Delete an agent
    Delete {
        /// Agent name
        name: String,
    },

    /// Supervisor management
    Supervisor {
        #[command(subcommand)]
        action: SupervisorAction,
    },

    /// Saga management
    Saga {
        #[command(subcommand)]
        action: SagaAction,
    },

    /// Workflow management
    Workflow {
        #[command(subcommand)]
        action: WorkflowAction,
    },

    /// Pool management
    Pool {
        #[command(subcommand)]
        action: PoolAction,
    },

    /// Cost budget management
    Cost {
        #[command(subcommand)]
        action: CostAction,
    },

    /// AXIS Trust management
    Axis {
        #[command(subcommand)]
        action: AxisAction,
    },

    /// Broker routing
    Broker {
        #[command(subcommand)]
        action: BrokerAction,
    },

    /// Edge deployment (Cloudflare Workers)
    Edge {
        #[command(subcommand)]
        action: EdgeAction,
    },

    /// Start the web dashboard
    Dashboard {
        /// Port to listen on
        #[arg(short, long, default_value = "4200")]
        port: u16,

        /// Open in browser automatically
        #[arg(long)]
        open: bool,
    },

    /// WASM Skill Marketplace
    Marketplace {
        #[command(subcommand)]
        action: MarketplaceAction,
    },

    /// View the causal audit trail
    Audit {
        #[command(subcommand)]
        action: AuditAction,
    },
}

// ── Supervisor subcommands ──────────────────────────────────────────

#[derive(Subcommand)]
enum SupervisorAction {
    /// Create a new supervisor
    Create {
        name: String,
        #[arg(short, long, default_value = "one-for-one")]
        strategy: String,
        #[arg(long, default_value = "3")]
        max_restarts: u32,
    },
    /// Add an agent to a supervisor
    Add {
        /// Supervisor name
        supervisor: String,
        /// Agent name
        agent: String,
    },
    /// Start a supervisor and its children
    Start { name: String },
    /// Stop a supervisor
    Stop { name: String },
    /// Show supervisor status
    Status { name: Option<String> },
}

// ── Saga subcommands ────────────────────────────────────────────────

#[derive(Subcommand)]
enum SagaAction {
    /// Create a new saga definition
    Create { name: String },
    /// Run a saga
    Run { name: String },
    /// Show saga status
    Status { name: Option<String> },
}

// ── Workflow subcommands ────────────────────────────────────────────

#[derive(Subcommand)]
enum WorkflowAction {
    /// Create a new workflow
    Create { name: String },
    /// Run a workflow
    Run { name: String },
    /// Show workflow status
    Status { name: Option<String> },
}

// ── Pool subcommands ────────────────────────────────────────────────

#[derive(Subcommand)]
enum PoolAction {
    /// Create a new pool
    Create {
        name: String,
        #[arg(short, long, default_value = "round-robin")]
        strategy: String,
    },
    /// Add an agent to a pool
    Add {
        /// Pool name
        pool: String,
        /// Agent name
        agent: String,
    },
    /// Start a pool
    Start { name: String },
    /// Show pool status
    Status { name: Option<String> },
}

// ── Cost subcommands ────────────────────────────────────────────────

#[derive(Subcommand)]
enum CostAction {
    /// Set a cost budget for an agent
    Set {
        agent: String,
        #[arg(short, long)]
        budget: String,
        #[arg(long)]
        alert_at: Option<u32>,
        #[arg(long)]
        action: Option<String>,
    },
    /// Show cost status for all agents
    Status,
}

// ── AXIS Trust subcommands ──────────────────────────────────────────

#[derive(Subcommand)]
enum AxisAction {
    /// Register an agent with AXIS Trust
    Register { agent: String },
    /// Check trust status
    Status { agent: String },
    /// Verify an external agent by AUID
    Verify { auid: String },
}

// ── Broker subcommands ──────────────────────────────────────────────

#[derive(Subcommand)]
enum BrokerAction {
    /// Show routing decision for a task (dry run)
    Route {
        /// Task description
        task: String,
    },
    /// Route and execute a task
    Execute {
        /// Task description
        task: String,
    },
    /// Show routing statistics
    Stats,
}

// ── Edge subcommands ────────────────────────────────────────────────

#[derive(Subcommand)]
enum EdgeAction {
    /// Authenticate with Cloudflare
    Login,
    /// Deploy an agent to Cloudflare Workers
    Deploy { agent: String },
    /// List all edge deployments
    List,
    /// Show edge deployment status
    Status { agent: String },
    /// Stream edge logs
    Logs { agent: String },
    /// Remove an agent from edge
    Undeploy { agent: String },
}

// ── Marketplace subcommands ─────────────────────────────────────────

#[derive(Subcommand)]
enum MarketplaceAction {
    /// Search for skills
    Search { query: String },
    /// Install a skill
    Install { name: String },
    /// List installed skills
    List,
    /// Publish a skill
    Publish { path: String },
}

// ── Audit subcommands ───────────────────────────────────────────────

#[derive(Subcommand)]
enum AuditAction {
    /// Stream the audit trail
    Tail {
        #[arg(short = 'n', long, default_value = "50")]
        lines: usize,
    },
    /// Search the audit trail
    Search { query: String },
}

// ── Main ────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "naos=info".into()),
        )
        .init();

    let cli_args = Cli::parse();

    let result = match cli_args.command {
        Commands::Init { name } => cli::init::run(&name).await,
        Commands::Create { name, template } => cli::create::run(&name, &template).await,
        Commands::Run { name } => cli::agent_run::run(&name).await,
        Commands::Stop { name } => cli::agent_stop::run(&name).await,
        Commands::Status => cli::status::run().await,
        Commands::Delete { name } => cli::delete::run(&name).await,

        Commands::Supervisor { action } => match action {
            SupervisorAction::Create { name, strategy, max_restarts } => {
                cli::supervisor::create(&name, &strategy, max_restarts).await
            }
            SupervisorAction::Add { supervisor, agent } => {
                cli::supervisor::add(&supervisor, &agent).await
            }
            SupervisorAction::Start { name } => cli::supervisor::start(&name).await,
            SupervisorAction::Stop { name } => cli::supervisor::stop(&name).await,
            SupervisorAction::Status { name } => cli::supervisor::status(name.as_deref()).await,
        },

        Commands::Saga { action } => match action {
            SagaAction::Create { name } => cli::saga::create(&name).await,
            SagaAction::Run { name } => cli::saga::run_saga(&name).await,
            SagaAction::Status { name } => cli::saga::status(name.as_deref()).await,
        },

        Commands::Workflow { action } => match action {
            WorkflowAction::Create { name } => cli::workflow::create(&name).await,
            WorkflowAction::Run { name } => cli::workflow::run_workflow(&name).await,
            WorkflowAction::Status { name } => cli::workflow::status(name.as_deref()).await,
        },

        Commands::Pool { action } => match action {
            PoolAction::Create { name, strategy } => cli::pool::create(&name, &strategy).await,
            PoolAction::Add { pool, agent } => cli::pool::add(&pool, &agent).await,
            PoolAction::Start { name } => cli::pool::start(&name).await,
            PoolAction::Status { name } => cli::pool::status(name.as_deref()).await,
        },

        Commands::Cost { action } => match action {
            CostAction::Set { agent, budget, alert_at, action: act } => {
                cli::cost::set(&agent, &budget, alert_at, act.as_deref()).await
            }
            CostAction::Status => cli::cost::status().await,
        },

        Commands::Axis { action } => match action {
            AxisAction::Register { agent } => cli::axis::register(&agent).await,
            AxisAction::Status { agent } => cli::axis::status(&agent).await,
            AxisAction::Verify { auid } => cli::axis::verify(&auid).await,
        },

        Commands::Broker { action } => match action {
            BrokerAction::Route { task } => cli::broker::route(&task).await,
            BrokerAction::Execute { task } => cli::broker::execute(&task).await,
            BrokerAction::Stats => cli::broker::stats().await,
        },

        Commands::Edge { action } => match action {
            EdgeAction::Login => cli::edge::login().await,
            EdgeAction::Deploy { agent } => cli::edge::deploy(&agent).await,
            EdgeAction::List => cli::edge::list().await,
            EdgeAction::Status { agent } => cli::edge::status(&agent).await,
            EdgeAction::Logs { agent } => cli::edge::logs(&agent).await,
            EdgeAction::Undeploy { agent } => cli::edge::undeploy(&agent).await,
        },

        Commands::Dashboard { port, open } => cli::dashboard::run(port, open).await,

        Commands::Marketplace { action } => match action {
            MarketplaceAction::Search { query } => cli::marketplace::search(&query).await,
            MarketplaceAction::Install { name } => cli::marketplace::install(&name).await,
            MarketplaceAction::List => cli::marketplace::list().await,
            MarketplaceAction::Publish { path } => cli::marketplace::publish(&path).await,
        },

        Commands::Audit { action } => match action {
            AuditAction::Tail { lines } => cli::audit::tail(lines).await,
            AuditAction::Search { query } => cli::audit::search(&query).await,
        },
    };

    if let Err(e) = result {
        eprintln!("{} {}", colored::Colorize::red("error:"), e);
        std::process::exit(1);
    }
}
