// ─── Types ────────────────────────────────────────────────────────────────────

export type PricingModel = "per-call" | "flat" | "free";
export type TrustTier = "T1" | "T2" | "T3" | "T4" | "T5";
export type CreditRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B";

export interface Publisher {
  name: string;
  handle: string;
  email: string;
  auid?: string;
  verified: boolean;
  stripeConnectId?: string;
}

export interface Pricing {
  model: PricingModel;
  pricePerCall?: number;
  flatPrice?: number;
  currency: string;
}

export interface TrustInfo {
  auid?: string;
  trustTier?: TrustTier;
  tScore?: number;
  creditRating?: CreditRating;
  verified: boolean;
}

export interface SkillStats {
  totalCalls: number;
  totalRevenue: number;
  avgLatencyMs: number;
  successRate: number;
  rating: number;
  reviews: number;
}

export interface Skill {
  name: string;
  version: string;
  description: string;
  longDescription: string;
  publisher: Publisher;
  pricing: Pricing;
  patterns: string[];
  trust: TrustInfo;
  stats: SkillStats;
  wasmHash: string;
  wasmSize: string;
  license: string;
  repository: string;
  category: string;
  inputs: string[];
  outputs: string[];
  limits: {
    maxInputSize: string;
    maxExecutionTime: string;
    memoryLimit: string;
  };
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
}

export interface InstalledSkill {
  name: string;
  version: string;
  publisher: string;
  installedAt: string;
  calls: number;
  spend: number;
}

export interface DeveloperEarnings {
  skill: string;
  calls: number;
  revenue: number;
  yourCut: number;
}

export interface Payout {
  date: string;
  amount: number;
  status: "completed" | "pending" | "processing";
  transferId: string;
}

export interface ActivityEntry {
  time: string;
  skill: string;
  calls: number;
  revenue: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { name: "Parsers", icon: "FileJson", count: 24 },
  { name: "Validators", icon: "ShieldCheck", count: 18 },
  { name: "Transformers", icon: "Shuffle", count: 31 },
  { name: "Calculators", icon: "Calculator", count: 12 },
  { name: "AI / ML", icon: "Brain", count: 45 },
  { name: "Security", icon: "Lock", count: 15 },
  { name: "Data", icon: "Database", count: 28 },
  { name: "Web", icon: "Globe", count: 22 },
  { name: "Text", icon: "Type", count: 19 },
  { name: "Media", icon: "Image", count: 14 },
] as const;

// ─── Mock Skills ──────────────────────────────────────────────────────────────

export const SKILLS: Skill[] = [
  {
    name: "json-parser",
    version: "1.2.0",
    description: "Fast JSON parsing and extraction with JQ-like query support",
    longDescription: "A high-performance JSON parsing skill built in Rust and compiled to WASM. Supports JQ-like query syntax for extracting nested values, array filtering, and object transformation. Handles malformed JSON gracefully with detailed error messages. Benchmarked at 3ms average latency for documents up to 1MB.",
    publisher: {
      name: "Verified Dev",
      handle: "@verified-dev",
      email: "dev@example.com",
      auid: "axis:company:dev:01hx7k2m3n4p5q6r7s8t9u0v1w:a3f7",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0001, currency: "USD" },
    patterns: ["parse json", "extract from json", "json query", "jq"],
    trust: {
      auid: "axis:company:dev:01hx7k2m3n4p5q6r7s8t9u0v1w:a3f7",
      trustTier: "T2",
      tScore: 94,
      creditRating: "AAA",
      verified: true,
    },
    stats: {
      totalCalls: 2_400_000,
      totalRevenue: 240.0,
      avgLatencyMs: 3,
      successRate: 99.97,
      rating: 4.9,
      reviews: 1234,
    },
    wasmHash: "sha256:a1b2c3d4e5f6...",
    wasmSize: "124 KB",
    license: "MIT",
    repository: "https://github.com/verified-dev/json-parser",
    category: "Parsers",
    inputs: ["string", "json"],
    outputs: ["json", "string"],
    limits: { maxInputSize: "1MB", maxExecutionTime: "100ms", memoryLimit: "256MB" },
    createdAt: "2025-08-15",
    updatedAt: "2026-03-20",
    featured: true,
  },
  {
    name: "email-extractor",
    version: "2.0.1",
    description: "Extract and validate email addresses from unstructured text",
    longDescription: "Powerful email extraction skill that finds, validates, and deduplicates email addresses from any text input. Supports RFC 5322 compliant validation, domain verification, and disposable email detection. Returns structured results with confidence scores.",
    publisher: {
      name: "Data Tools Inc",
      handle: "@data-tools",
      email: "team@datatools.io",
      auid: "axis:company:datatools:01hy8l3n4o5p6q7r8s9t0u1v2w:b4g8",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0002, currency: "USD" },
    patterns: ["extract emails", "find email addresses", "validate email"],
    trust: {
      auid: "axis:company:datatools:01hy8l3n4o5p6q7r8s9t0u1v2w:b4g8",
      trustTier: "T3",
      tScore: 82,
      creditRating: "AA",
      verified: true,
    },
    stats: {
      totalCalls: 890_000,
      totalRevenue: 178.0,
      avgLatencyMs: 8,
      successRate: 99.85,
      rating: 4.7,
      reviews: 567,
    },
    wasmHash: "sha256:b2c3d4e5f6a7...",
    wasmSize: "98 KB",
    license: "Apache-2.0",
    repository: "https://github.com/data-tools/email-extractor",
    category: "Data",
    inputs: ["string"],
    outputs: ["json"],
    limits: { maxInputSize: "5MB", maxExecutionTime: "200ms", memoryLimit: "512MB" },
    createdAt: "2025-06-10",
    updatedAt: "2026-02-28",
    featured: true,
  },
  {
    name: "csv-parser",
    version: "1.0.0",
    description: "Blazing fast CSV parsing with type inference and schema detection",
    longDescription: "Parse CSV files at near-native speed with automatic type inference, header detection, and configurable delimiters. Outputs structured JSON with detected schema. Handles edge cases like quoted fields, embedded newlines, and mixed encodings.",
    publisher: {
      name: "Utils Collective",
      handle: "@utils",
      email: "hello@utils.dev",
      auid: "axis:org:utils:01hz9m4o5p6q7r8s9t0u1v2w3x:c5h9",
      verified: true,
    },
    pricing: { model: "free", currency: "USD" },
    patterns: ["parse csv", "csv to json", "read csv"],
    trust: {
      auid: "axis:org:utils:01hz9m4o5p6q7r8s9t0u1v2w3x:c5h9",
      trustTier: "T3",
      tScore: 78,
      creditRating: "A",
      verified: true,
    },
    stats: {
      totalCalls: 1_560_000,
      totalRevenue: 0,
      avgLatencyMs: 5,
      successRate: 99.92,
      rating: 4.5,
      reviews: 234,
    },
    wasmHash: "sha256:c3d4e5f6a7b8...",
    wasmSize: "156 KB",
    license: "MIT",
    repository: "https://github.com/utils-collective/csv-parser",
    category: "Parsers",
    inputs: ["string"],
    outputs: ["json"],
    limits: { maxInputSize: "10MB", maxExecutionTime: "500ms", memoryLimit: "1GB" },
    createdAt: "2025-11-01",
    updatedAt: "2026-01-15",
    featured: true,
  },
  {
    name: "json-validator",
    version: "2.1.0",
    description: "JSON Schema validation with detailed error reporting",
    longDescription: "Validate JSON documents against JSON Schema (Draft 2020-12). Returns detailed validation errors with JSON Pointer paths, expected vs actual types, and suggested fixes. Supports custom format validators and cross-reference resolution.",
    publisher: {
      name: "Data Tools Inc",
      handle: "@data-tools",
      email: "team@datatools.io",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0002, currency: "USD" },
    patterns: ["validate json", "json schema", "check json format"],
    trust: { trustTier: "T3", tScore: 82, creditRating: "AA", verified: true },
    stats: {
      totalCalls: 670_000,
      totalRevenue: 134.0,
      avgLatencyMs: 4,
      successRate: 99.99,
      rating: 4.7,
      reviews: 567,
    },
    wasmHash: "sha256:d4e5f6a7b8c9...",
    wasmSize: "112 KB",
    license: "MIT",
    repository: "https://github.com/data-tools/json-validator",
    category: "Validators",
    inputs: ["json", "json"],
    outputs: ["json"],
    limits: { maxInputSize: "2MB", maxExecutionTime: "150ms", memoryLimit: "256MB" },
    createdAt: "2025-09-20",
    updatedAt: "2026-03-10",
  },
  {
    name: "json-diff",
    version: "1.0.0",
    description: "Compute structural differences between two JSON documents",
    longDescription: "Compare two JSON documents and produce a detailed diff report showing additions, deletions, and modifications. Supports configurable comparison modes (strict, loose, semantic) and outputs RFC 6902 JSON Patch format.",
    publisher: {
      name: "Utils Collective",
      handle: "@utils",
      email: "hello@utils.dev",
      verified: true,
    },
    pricing: { model: "free", currency: "USD" },
    patterns: ["diff json", "compare json", "json patch"],
    trust: { trustTier: "T4", tScore: 65, creditRating: "BB", verified: false },
    stats: {
      totalCalls: 340_000,
      totalRevenue: 0,
      avgLatencyMs: 6,
      successRate: 99.88,
      rating: 4.2,
      reviews: 89,
    },
    wasmHash: "sha256:e5f6a7b8c9d0...",
    wasmSize: "88 KB",
    license: "MIT",
    repository: "https://github.com/utils-collective/json-diff",
    category: "Transformers",
    inputs: ["json", "json"],
    outputs: ["json"],
    limits: { maxInputSize: "5MB", maxExecutionTime: "200ms", memoryLimit: "512MB" },
    createdAt: "2026-01-05",
    updatedAt: "2026-03-01",
  },
  {
    name: "markdown-to-html",
    version: "1.0.0",
    description: "Convert Markdown to sanitized HTML with syntax highlighting",
    longDescription: "Full-featured Markdown to HTML converter supporting GFM, math expressions, and code syntax highlighting for 50+ languages. Outputs sanitized HTML safe for embedding. Configurable themes and CSS class prefixes.",
    publisher: {
      name: "Converter Labs",
      handle: "@converter",
      email: "labs@converter.dev",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0001, currency: "USD" },
    patterns: ["markdown to html", "convert markdown", "render markdown"],
    trust: { trustTier: "T3", tScore: 75, creditRating: "A", verified: true },
    stats: {
      totalCalls: 450_000,
      totalRevenue: 45.0,
      avgLatencyMs: 12,
      successRate: 99.95,
      rating: 4.6,
      reviews: 178,
    },
    wasmHash: "sha256:f6a7b8c9d0e1...",
    wasmSize: "210 KB",
    license: "MIT",
    repository: "https://github.com/converter-labs/markdown-to-html",
    category: "Transformers",
    inputs: ["string"],
    outputs: ["string"],
    limits: { maxInputSize: "2MB", maxExecutionTime: "300ms", memoryLimit: "512MB" },
    createdAt: "2026-04-09",
    updatedAt: "2026-04-09",
  },
  {
    name: "regex-matcher",
    version: "2.0.0",
    description: "High-performance regex matching with named capture groups",
    longDescription: "Execute complex regular expressions against text with support for named capture groups, lookaheads, and Unicode categories. Returns all matches with positions and group values. Uses Rust's regex engine for linear-time guarantees.",
    publisher: {
      name: "Pattern Systems",
      handle: "@patterns",
      email: "info@patterns.dev",
      verified: true,
    },
    pricing: { model: "free", currency: "USD" },
    patterns: ["regex match", "pattern match", "find pattern", "regular expression"],
    trust: { trustTier: "T3", tScore: 71, creditRating: "A", verified: true },
    stats: {
      totalCalls: 780_000,
      totalRevenue: 0,
      avgLatencyMs: 2,
      successRate: 99.99,
      rating: 4.8,
      reviews: 345,
    },
    wasmHash: "sha256:a7b8c9d0e1f2...",
    wasmSize: "76 KB",
    license: "Apache-2.0",
    repository: "https://github.com/pattern-systems/regex-matcher",
    category: "Text",
    inputs: ["string", "string"],
    outputs: ["json"],
    limits: { maxInputSize: "10MB", maxExecutionTime: "50ms", memoryLimit: "128MB" },
    createdAt: "2026-04-09",
    updatedAt: "2026-04-09",
  },
  {
    name: "date-parser",
    version: "1.1.0",
    description: "Parse natural language dates into ISO 8601 timestamps",
    longDescription: "Convert natural language date expressions like 'next Tuesday', 'in 3 weeks', or '2nd quarter 2026' into precise ISO 8601 timestamps. Supports 15 languages, relative dates, date ranges, and timezone-aware parsing.",
    publisher: {
      name: "Utils Collective",
      handle: "@utils",
      email: "hello@utils.dev",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.00005, currency: "USD" },
    patterns: ["parse date", "natural language date", "date to iso"],
    trust: { trustTier: "T3", tScore: 78, creditRating: "A", verified: true },
    stats: {
      totalCalls: 520_000,
      totalRevenue: 26.0,
      avgLatencyMs: 4,
      successRate: 99.7,
      rating: 4.4,
      reviews: 156,
    },
    wasmHash: "sha256:b8c9d0e1f2a3...",
    wasmSize: "340 KB",
    license: "MIT",
    repository: "https://github.com/utils-collective/date-parser",
    category: "Parsers",
    inputs: ["string"],
    outputs: ["string", "json"],
    limits: { maxInputSize: "1KB", maxExecutionTime: "50ms", memoryLimit: "64MB" },
    createdAt: "2026-04-10",
    updatedAt: "2026-04-10",
  },
  {
    name: "sentiment-analyzer",
    version: "3.0.0",
    description: "Multi-language sentiment analysis with emotion detection",
    longDescription: "Analyze text sentiment across 30+ languages using a compact transformer model compiled to WASM. Returns sentiment scores (positive/negative/neutral), emotion labels (joy, anger, sadness, etc.), and confidence values. Fine-tuned on social media and customer feedback data.",
    publisher: {
      name: "NLP Works",
      handle: "@nlp-works",
      email: "team@nlpworks.ai",
      auid: "axis:company:nlpworks:01ia0n5p6q7r8s9t0u1v2w3x4y:d6i0",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0005, currency: "USD" },
    patterns: ["sentiment analysis", "analyze sentiment", "emotion detection", "text mood"],
    trust: {
      auid: "axis:company:nlpworks:01ia0n5p6q7r8s9t0u1v2w3x4y:d6i0",
      trustTier: "T2",
      tScore: 91,
      creditRating: "AAA",
      verified: true,
    },
    stats: {
      totalCalls: 3_200_000,
      totalRevenue: 1600.0,
      avgLatencyMs: 45,
      successRate: 99.6,
      rating: 4.8,
      reviews: 892,
    },
    wasmHash: "sha256:c9d0e1f2a3b4...",
    wasmSize: "4.2 MB",
    license: "Commercial",
    repository: "https://github.com/nlp-works/sentiment-analyzer",
    category: "AI / ML",
    inputs: ["string"],
    outputs: ["json"],
    limits: { maxInputSize: "50KB", maxExecutionTime: "500ms", memoryLimit: "1GB" },
    createdAt: "2025-05-01",
    updatedAt: "2026-04-01",
    featured: true,
  },
  {
    name: "image-resizer",
    version: "1.3.0",
    description: "Resize, crop, and convert images with WASM-powered speed",
    longDescription: "Process images entirely in WASM without server round-trips. Supports resize, crop, rotate, flip, format conversion (PNG, JPEG, WebP, AVIF), and quality adjustment. Uses SIMD instructions for near-native performance.",
    publisher: {
      name: "Media Tools",
      handle: "@media-tools",
      email: "dev@mediatools.io",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0003, currency: "USD" },
    patterns: ["resize image", "crop image", "convert image format"],
    trust: { trustTier: "T3", tScore: 76, creditRating: "A", verified: true },
    stats: {
      totalCalls: 1_100_000,
      totalRevenue: 330.0,
      avgLatencyMs: 25,
      successRate: 99.8,
      rating: 4.6,
      reviews: 412,
    },
    wasmHash: "sha256:d0e1f2a3b4c5...",
    wasmSize: "890 KB",
    license: "MIT",
    repository: "https://github.com/media-tools/image-resizer",
    category: "Media",
    inputs: ["binary"],
    outputs: ["binary"],
    limits: { maxInputSize: "25MB", maxExecutionTime: "2000ms", memoryLimit: "2GB" },
    createdAt: "2025-10-15",
    updatedAt: "2026-03-28",
  },
  {
    name: "url-validator",
    version: "1.0.2",
    description: "Validate and normalize URLs with DNS and SSL checks",
    longDescription: "Comprehensive URL validation that checks syntax, resolves DNS, verifies SSL certificates, and normalizes URLs to canonical form. Detects phishing patterns, IDN homograph attacks, and known malicious domains.",
    publisher: {
      name: "SecureNet",
      handle: "@securenet",
      email: "security@securenet.io",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0001, currency: "USD" },
    patterns: ["validate url", "check url", "normalize url", "url safety"],
    trust: { trustTier: "T2", tScore: 89, creditRating: "AAA", verified: true },
    stats: {
      totalCalls: 920_000,
      totalRevenue: 92.0,
      avgLatencyMs: 15,
      successRate: 99.95,
      rating: 4.7,
      reviews: 298,
    },
    wasmHash: "sha256:e1f2a3b4c5d6...",
    wasmSize: "145 KB",
    license: "Apache-2.0",
    repository: "https://github.com/securenet/url-validator",
    category: "Security",
    inputs: ["string"],
    outputs: ["json"],
    limits: { maxInputSize: "10KB", maxExecutionTime: "300ms", memoryLimit: "128MB" },
    createdAt: "2025-12-01",
    updatedAt: "2026-04-05",
  },
  {
    name: "sql-builder",
    version: "2.2.0",
    description: "Build safe, parameterized SQL queries from natural language",
    longDescription: "Convert natural language queries into safe, parameterized SQL. Supports PostgreSQL, MySQL, and SQLite dialects. Prevents SQL injection by design. Includes schema-aware completion and query optimization hints.",
    publisher: {
      name: "DB Forge",
      handle: "@db-forge",
      email: "forge@dbforge.dev",
      verified: true,
    },
    pricing: { model: "per-call", pricePerCall: 0.0003, currency: "USD" },
    patterns: ["build sql", "natural language to sql", "generate query"],
    trust: { trustTier: "T2", tScore: 88, creditRating: "AA", verified: true },
    stats: {
      totalCalls: 680_000,
      totalRevenue: 204.0,
      avgLatencyMs: 18,
      successRate: 99.7,
      rating: 4.5,
      reviews: 234,
    },
    wasmHash: "sha256:f2a3b4c5d6e7...",
    wasmSize: "520 KB",
    license: "MIT",
    repository: "https://github.com/db-forge/sql-builder",
    category: "Data",
    inputs: ["string", "json"],
    outputs: ["string", "json"],
    limits: { maxInputSize: "10KB", maxExecutionTime: "200ms", memoryLimit: "256MB" },
    createdAt: "2025-07-20",
    updatedAt: "2026-03-15",
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

export function formatPrice(pricing: Pricing): string {
  if (pricing.model === "free") return "FREE";
  if (pricing.model === "per-call" && pricing.pricePerCall != null) {
    return `$${pricing.pricePerCall}/call`;
  }
  if (pricing.model === "flat" && pricing.flatPrice != null) {
    return `$${pricing.flatPrice}/mo`;
  }
  return "Contact";
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function trustBadge(trust: TrustInfo): string {
  if (!trust.verified) return "Unverified";
  const tier = trust.trustTier ?? "?";
  const rating = trust.creditRating ?? "?";
  return `${tier}/${rating}`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date("2026-04-11");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function getStarDisplay(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

export const FEATURED_SKILLS = SKILLS.filter((s) => s.featured);
export const RECENTLY_ADDED = [...SKILLS].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

// ─── Developer Dashboard Mock Data ───────────────────────────────────────────

export const DEVELOPER_EARNINGS: DeveloperEarnings[] = [
  { skill: "json-parser", calls: 2_400_000, revenue: 240.0, yourCut: 168.0 },
  { skill: "csv-parser", calls: 890_000, revenue: 89.0, yourCut: 62.3 },
];

export const PAYOUTS: Payout[] = [
  { date: "2026-03-15", amount: 156.0, status: "completed", transferId: "tr_1abc2def3ghi" },
  { date: "2026-02-15", amount: 134.5, status: "completed", transferId: "tr_4jkl5mno6pqr" },
  { date: "2026-01-15", amount: 98.2, status: "completed", transferId: "tr_7stu8vwx9yza" },
];

export const RECENT_ACTIVITY: ActivityEntry[] = [
  { time: "12:05", skill: "json-parser", calls: 1245, revenue: 0.12 },
  { time: "11:30", skill: "csv-parser", calls: 567, revenue: 0.06 },
  { time: "10:15", skill: "json-parser", calls: 2100, revenue: 0.21 },
  { time: "09:45", skill: "json-parser", calls: 890, revenue: 0.09 },
  { time: "08:20", skill: "csv-parser", calls: 345, revenue: 0.03 },
];

export const INSTALLED_SKILLS: InstalledSkill[] = [
  { name: "json-parser", version: "1.2.0", publisher: "@verified-dev", installedAt: "2026-02-10", calls: 1245, spend: 0.12 },
  { name: "email-extractor", version: "2.0.1", publisher: "@data-tools", installedAt: "2026-01-20", calls: 892, spend: 0.18 },
];
