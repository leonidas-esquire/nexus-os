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

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  author: string;
  authorHandle: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpful: number;
  verified: boolean;
}

const REVIEW_POOL: Review[] = [
  {
    id: "r1", author: "Alice Chen", authorHandle: "@alice-ml", rating: 5,
    title: "Blazing fast and reliable",
    body: "We've been using this in production for 6 months. Handles 50K calls/day without a single failure. The JQ-like query syntax is a huge time saver for our data pipeline agents.",
    date: "2026-03-28", helpful: 42, verified: true,
  },
  {
    id: "r2", author: "Marcus Webb", authorHandle: "@mwebb", rating: 5,
    title: "Best in class for the price",
    body: "Switched from a custom solution and cut our latency by 60%. The WASM sandbox gives us confidence that untrusted payloads won't cause issues. Highly recommend.",
    date: "2026-03-15", helpful: 31, verified: true,
  },
  {
    id: "r3", author: "Priya Sharma", authorHandle: "@priya-dev", rating: 4,
    title: "Great skill, minor docs gap",
    body: "The core functionality is excellent — fast, accurate, and well-tested. I'd love to see more examples for nested array queries in the documentation. Otherwise perfect.",
    date: "2026-02-20", helpful: 18, verified: true,
  },
  {
    id: "r4", author: "James O'Brien", authorHandle: "@jobrien", rating: 5,
    title: "Exactly what our agents needed",
    body: "Integrated this into our multi-agent workflow and it just works. The error messages for malformed JSON are incredibly helpful for debugging. 10/10.",
    date: "2026-02-05", helpful: 27, verified: false,
  },
  {
    id: "r5", author: "Yuki Tanaka", authorHandle: "@yuki-t", rating: 4,
    title: "Solid performance, good value",
    body: "At $0.0001/call this is a steal. We process millions of JSON documents monthly and the cost is negligible. Would give 5 stars if streaming support was added.",
    date: "2026-01-18", helpful: 15, verified: true,
  },
  {
    id: "r6", author: "Sarah Kim", authorHandle: "@skim-ai", rating: 5,
    title: "Transformed our NLP pipeline",
    body: "The sentiment analysis is remarkably accurate across English, Spanish, and Korean. Emotion detection adds a layer our previous solution didn't have. Worth every cent.",
    date: "2026-03-22", helpful: 38, verified: true,
  },
  {
    id: "r7", author: "Dev Patel", authorHandle: "@devp", rating: 3,
    title: "Good but could be faster",
    body: "Works well for most use cases but latency spikes on very large inputs. The 200ms timeout is tight for documents over 2MB. Hope to see optimizations in the next version.",
    date: "2026-02-10", helpful: 12, verified: true,
  },
  {
    id: "r8", author: "Emma Wilson", authorHandle: "@ewilson", rating: 5,
    title: "Clean API, great results",
    body: "The structured output with confidence scores makes it easy to build reliable downstream logic. We use this for email validation in our onboarding flow and it catches 99% of bad addresses.",
    date: "2026-03-05", helpful: 22, verified: true,
  },
  {
    id: "r9", author: "Carlos Ruiz", authorHandle: "@cruiz", rating: 4,
    title: "Reliable CSV handling",
    body: "Handles edge cases that broke our previous parser — quoted fields, embedded newlines, mixed encodings. The schema detection is a nice bonus. Free tier is generous.",
    date: "2026-01-25", helpful: 19, verified: false,
  },
  {
    id: "r10", author: "Lena Müller", authorHandle: "@lena-m", rating: 5,
    title: "Essential for data pipelines",
    body: "We parse hundreds of CSV files daily and this skill handles them all flawlessly. Type inference saves us hours of manual schema definition. Highly recommend for any data-heavy workflow.",
    date: "2026-02-28", helpful: 25, verified: true,
  },
];

// Map skill names to their reviews (deterministic based on skill index)
export function getReviewsForSkill(skillName: string): Review[] {
  const idx = SKILLS.findIndex((s) => s.name === skillName);
  if (idx === -1) return [];
  // Each skill gets 3-5 reviews, cycling through the pool
  const count = 3 + (idx % 3);
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const r = REVIEW_POOL[(idx * 3 + i) % REVIEW_POOL.length];
    reviews.push({ ...r, id: `${skillName}-${r.id}` });
  }
  return reviews;
}

// ─── Analytics Data (Developer Portal) ───────────────────────────────────────

export interface DailyMetric {
  date: string;
  calls: number;
  revenue: number;
}

function generateDailyMetrics(baseCalls: number, baseRevenue: number, days: number): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const now = new Date("2026-04-11");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    // Add some variance
    const variance = 0.7 + Math.sin(i * 0.5) * 0.3 + (i % 7 < 2 ? -0.15 : 0.1);
    const dayCalls = Math.round(baseCalls * variance);
    const dayRevenue = parseFloat((baseRevenue * variance).toFixed(4));
    metrics.push({ date: dateStr, calls: dayCalls, revenue: dayRevenue });
  }
  return metrics;
}

export const ANALYTICS_JSON_PARSER = generateDailyMetrics(80000, 8.0, 30);
export const ANALYTICS_CSV_PARSER = generateDailyMetrics(30000, 3.0, 30);

export const ANALYTICS_COMBINED: DailyMetric[] = ANALYTICS_JSON_PARSER.map((m, i) => ({
  date: m.date,
  calls: m.calls + ANALYTICS_CSV_PARSER[i].calls,
  revenue: parseFloat((m.revenue + ANALYTICS_CSV_PARSER[i].revenue).toFixed(4)),
}));

// ─── Compare Skills Helper ───────────────────────────────────────────────────

export interface CompareField {
  label: string;
  key: string;
  getValue: (s: Skill) => string;
  highlight?: "lower-better" | "higher-better";
}

export const COMPARE_FIELDS: CompareField[] = [
  { label: "Version", key: "version", getValue: (s) => `v${s.version}` },
  { label: "Publisher", key: "publisher", getValue: (s) => s.publisher.handle },
  { label: "Category", key: "category", getValue: (s) => s.category },
  { label: "Price", key: "price", getValue: (s) => formatPrice(s.pricing) },
  { label: "Trust", key: "trust", getValue: (s) => s.trust.verified ? trustBadge(s.trust) : "Unverified" },
  { label: "T-Score", key: "tscore", getValue: (s) => s.trust.tScore?.toString() ?? "—", highlight: "higher-better" },
  { label: "Rating", key: "rating", getValue: (s) => `${s.stats.rating} / 5`, highlight: "higher-better" },
  { label: "Reviews", key: "reviews", getValue: (s) => formatNumber(s.stats.reviews), highlight: "higher-better" },
  { label: "Total Calls", key: "calls", getValue: (s) => formatNumber(s.stats.totalCalls), highlight: "higher-better" },
  { label: "Avg Latency", key: "latency", getValue: (s) => `${s.stats.avgLatencyMs}ms`, highlight: "lower-better" },
  { label: "Success Rate", key: "success", getValue: (s) => `${s.stats.successRate}%`, highlight: "higher-better" },
  { label: "WASM Size", key: "size", getValue: (s) => s.wasmSize },
  { label: "License", key: "license", getValue: (s) => s.license },
  { label: "Max Input", key: "maxInput", getValue: (s) => s.limits.maxInputSize },
  { label: "Max Execution", key: "maxExec", getValue: (s) => s.limits.maxExecutionTime, highlight: "lower-better" },
  { label: "Memory Limit", key: "memLimit", getValue: (s) => s.limits.memoryLimit },
  { label: "Inputs", key: "inputs", getValue: (s) => s.inputs.join(", ") },
  { label: "Outputs", key: "outputs", getValue: (s) => s.outputs.join(", ") },
];


// ─── Trending Skills (7-day growth) ─────────────────────────────────────────

export interface TrendingSkill {
  name: string;
  callsLast7d: number;
  callsPrev7d: number;
  growthPct: number;
  sparkline: number[]; // 7 daily values
}

export const TRENDING_SKILLS: TrendingSkill[] = [
  {
    name: "sentiment-analyzer",
    callsLast7d: 185_000,
    callsPrev7d: 98_000,
    growthPct: 88.8,
    sparkline: [12000, 14500, 18200, 22000, 28000, 35000, 42000],
  },
  {
    name: "json-parser",
    callsLast7d: 420_000,
    callsPrev7d: 280_000,
    growthPct: 50.0,
    sparkline: [35000, 42000, 48000, 55000, 62000, 68000, 75000],
  },
  {
    name: "image-resizer",
    callsLast7d: 95_000,
    callsPrev7d: 68_000,
    growthPct: 39.7,
    sparkline: [8000, 9200, 11000, 13500, 15000, 17000, 19500],
  },
  {
    name: "regex-matcher",
    callsLast7d: 110_000,
    callsPrev7d: 82_000,
    growthPct: 34.1,
    sparkline: [12000, 13000, 14500, 15800, 16200, 17500, 19000],
  },
  {
    name: "sql-builder",
    callsLast7d: 78_000,
    callsPrev7d: 60_000,
    growthPct: 30.0,
    sparkline: [8500, 9200, 10000, 10800, 11500, 12200, 13000],
  },
  {
    name: "url-validator",
    callsLast7d: 62_000,
    callsPrev7d: 50_000,
    growthPct: 24.0,
    sparkline: [7000, 7500, 8200, 8800, 9200, 9800, 10500],
  },
];

// ─── Version History / Changelog ────────────────────────────────────────────

export interface VersionEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  summary: string;
  changes: string[];
  breaking?: boolean;
  wasmSize: string;
  downloads: number;
}

const VERSION_TEMPLATES: Record<string, VersionEntry[]> = {
  "json-parser": [
    {
      version: "1.2.0",
      date: "2026-03-20",
      type: "minor",
      summary: "Added recursive descent mode and streaming JSON support",
      changes: [
        "Added `--stream` flag for processing large JSON files incrementally",
        "New recursive descent parser mode for deeply nested structures (>100 levels)",
        "Improved error messages with line/column indicators for malformed JSON",
        "Performance improvement: 15% faster parsing for documents >500KB",
      ],
      wasmSize: "124 KB",
      downloads: 45_200,
    },
    {
      version: "1.1.0",
      date: "2026-01-08",
      type: "minor",
      summary: "JQ-like query syntax and array filtering",
      changes: [
        "Implemented JQ-compatible query syntax for field extraction",
        "Added array filtering with `select()` and `map()` operators",
        "New `--pretty` output flag for formatted JSON responses",
        "Fixed edge case with Unicode escape sequences in keys",
      ],
      wasmSize: "118 KB",
      downloads: 112_000,
    },
    {
      version: "1.0.1",
      date: "2025-11-02",
      type: "patch",
      summary: "Bug fix for empty array handling",
      changes: [
        "Fixed crash when parsing empty arrays in nested objects",
        "Improved memory allocation for large documents",
      ],
      wasmSize: "112 KB",
      downloads: 89_500,
    },
    {
      version: "1.0.0",
      date: "2025-08-15",
      type: "major",
      summary: "Initial release — high-performance JSON parsing in WASM",
      changes: [
        "Core JSON parsing engine built in Rust, compiled to WASM",
        "Support for JSON Path expressions",
        "Graceful error handling with detailed error messages",
        "Benchmarked at 3ms average latency for 1MB documents",
      ],
      wasmSize: "108 KB",
      downloads: 234_000,
    },
  ],
  "email-extractor": [
    {
      version: "2.0.1",
      date: "2026-03-05",
      type: "patch",
      summary: "Fixed false positives in disposable email detection",
      changes: [
        "Updated disposable email domain list (added 120 new domains)",
        "Fixed regex edge case causing false positives with .museum TLDs",
        "Improved confidence scoring algorithm accuracy by 8%",
      ],
      wasmSize: "98 KB",
      downloads: 18_200,
    },
    {
      version: "2.0.0",
      date: "2026-01-20",
      type: "major",
      summary: "Major rewrite with RFC 5322 compliance and domain verification",
      changes: [
        "BREAKING: Output schema changed — `emails` field now returns objects instead of strings",
        "Full RFC 5322 compliant email validation",
        "Added real-time domain MX record verification",
        "Disposable email detection with confidence scores",
        "Batch processing support for multiple text inputs",
      ],
      breaking: true,
      wasmSize: "95 KB",
      downloads: 67_800,
    },
    {
      version: "1.0.0",
      date: "2025-09-10",
      type: "major",
      summary: "Initial release — email extraction from unstructured text",
      changes: [
        "Core email extraction engine with regex-based detection",
        "Basic validation and deduplication",
        "Support for common email formats",
      ],
      wasmSize: "72 KB",
      downloads: 145_000,
    },
  ],
  "csv-parser": [
    {
      version: "1.0.0",
      date: "2025-12-01",
      type: "major",
      summary: "Initial release — CSV/TSV parsing with schema inference",
      changes: [
        "High-performance CSV and TSV parsing engine",
        "Automatic schema inference with type detection",
        "Support for custom delimiters and quote characters",
        "Streaming mode for files up to 10MB",
      ],
      wasmSize: "156 KB",
      downloads: 98_000,
    },
  ],
};

// Generate generic version history for skills without custom entries
function generateVersionHistory(skill: Skill): VersionEntry[] {
  const parts = skill.version.split(".").map(Number);
  const entries: VersionEntry[] = [
    {
      version: skill.version,
      date: skill.updatedAt,
      type: parts[1] > 0 ? "minor" : "major",
      summary: `Latest release with performance improvements and bug fixes`,
      changes: [
        "Performance optimizations reducing average latency by 10%",
        "Updated dependency chain for improved security",
        "Minor bug fixes and stability improvements",
      ],
      wasmSize: skill.wasmSize,
      downloads: Math.round(skill.stats.totalCalls * 0.02),
    },
    {
      version: `${parts[0]}.0.0`,
      date: skill.createdAt,
      type: "major",
      summary: `Initial release — ${skill.description.toLowerCase()}`,
      changes: [
        `Core ${skill.category.toLowerCase()} engine built in Rust/WASM`,
        "Full pattern matching support for broker integration",
        "Comprehensive error handling and input validation",
        "AXIS trust verification and sandbox compliance",
      ],
      wasmSize: `${parseInt(skill.wasmSize) - 12} KB`,
      downloads: Math.round(skill.stats.totalCalls * 0.08),
    },
  ];
  return entries;
}

export function getVersionHistory(skillName: string): VersionEntry[] {
  if (VERSION_TEMPLATES[skillName]) return VERSION_TEMPLATES[skillName];
  const skill = SKILLS.find((s) => s.name === skillName);
  if (!skill) return [];
  return generateVersionHistory(skill);
}

// ─── Dependency Graph ───────────────────────────────────────────────────────

export interface SkillDependency {
  from: string;
  to: string;
  type: "requires" | "optional" | "commonly-used-with";
}

export interface SkillNode {
  name: string;
  category: string;
  calls: number;
  x: number;
  y: number;
}

export const SKILL_DEPENDENCIES: SkillDependency[] = [
  // Hard dependencies
  { from: "json-diff", to: "json-parser", type: "requires" },
  { from: "json-validator", to: "json-parser", type: "requires" },
  { from: "sql-builder", to: "json-parser", type: "optional" },
  { from: "email-extractor", to: "regex-matcher", type: "requires" },
  { from: "url-validator", to: "regex-matcher", type: "requires" },
  { from: "markdown-to-html", to: "regex-matcher", type: "optional" },
  // Commonly used together
  { from: "json-parser", to: "csv-parser", type: "commonly-used-with" },
  { from: "csv-parser", to: "sql-builder", type: "commonly-used-with" },
  { from: "email-extractor", to: "sentiment-analyzer", type: "commonly-used-with" },
  { from: "sentiment-analyzer", to: "json-parser", type: "commonly-used-with" },
  { from: "image-resizer", to: "url-validator", type: "commonly-used-with" },
  { from: "date-parser", to: "json-parser", type: "commonly-used-with" },
  { from: "markdown-to-html", to: "image-resizer", type: "commonly-used-with" },
];

// Pre-computed node positions for the graph (circular layout)
export function getGraphNodes(): SkillNode[] {
  const skills = SKILLS;
  const cx = 300, cy = 250, rx = 220, ry = 180;
  return skills.map((s, i) => {
    const angle = (i / skills.length) * 2 * Math.PI - Math.PI / 2;
    return {
      name: s.name,
      category: s.category,
      calls: s.stats.totalCalls,
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  });
}

export function getSkillDependencies(skillName: string): {
  requires: string[];
  optionalDeps: string[];
  commonlyUsedWith: string[];
  dependedOnBy: string[];
} {
  const requires = SKILL_DEPENDENCIES
    .filter((d) => d.from === skillName && d.type === "requires")
    .map((d) => d.to);
  const optionalDeps = SKILL_DEPENDENCIES
    .filter((d) => d.from === skillName && d.type === "optional")
    .map((d) => d.to);
  const commonlyUsedWith = SKILL_DEPENDENCIES
    .filter(
      (d) =>
        (d.from === skillName || d.to === skillName) &&
        d.type === "commonly-used-with"
    )
    .map((d) => (d.from === skillName ? d.to : d.from));
  const dependedOnBy = SKILL_DEPENDENCIES
    .filter((d) => d.to === skillName && (d.type === "requires" || d.type === "optional"))
    .map((d) => d.from);
  return { requires, optionalDeps, commonlyUsedWith, dependedOnBy };
}


/* ─── Skill Usage Examples ───────────────────────────────────────────────── */
export interface UsageExample {
  title: string;
  language: "toml" | "rust" | "python" | "bash" | "json";
  code: string;
  description: string;
}

export const SKILL_USAGE_EXAMPLES: Record<string, UsageExample[]> = {
  "json-parser": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Add json-parser to your agent's skill dependencies in nexus.config.toml",
      code: `[agent.skills]
json-parser = { version = "^1.2.0", priority = "high" }

[[agent.routes]]
pattern = "parse this JSON"
skill   = "json-parser"
input   = "{{ message.content }}"`,
    },
    {
      title: "Rust SDK",
      language: "rust",
      description: "Call json-parser programmatically from Rust using the Nexus SDK",
      code: `use nexus_sdk::SkillClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = SkillClient::new("json-parser")?;

    let result = client.invoke(serde_json::json!({
        "input": r#"{"users": [{"name": "Alice"}]}"#,
        "query": ".users[0].name"
    })).await?;

    println!("Parsed: {}", result["output"]);
    Ok(())
}`,
    },
    {
      title: "Python SDK",
      language: "python",
      description: "Use the Nexus Python SDK to invoke json-parser in your scripts",
      code: `from nexus import SkillClient

client = SkillClient("json-parser")

result = client.invoke({
    "input": '{"users": [{"name": "Alice", "age": 30}]}',
    "query": ".users[0]"
})

print(f"Name: {result['output']['name']}")
print(f"Age: {result['output']['age']}")`,
    },
    {
      title: "CLI Usage",
      language: "bash",
      description: "Invoke json-parser directly from the command line",
      code: `# Parse JSON from stdin
echo '{"key": "value"}' | naos skill invoke json-parser

# Parse with a JQ-like query
naos skill invoke json-parser \\
  --input '{"users": [{"name": "Alice"}]}' \\
  --query '.users[0].name'

# Stream large JSON files
cat large-file.json | naos skill invoke json-parser --stream`,
    },
  ],
  "csv-parser": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Route CSV parsing tasks to csv-parser in your agent config",
      code: `[agent.skills]
csv-parser = { version = "^2.0.0" }

[[agent.routes]]
pattern = "parse CSV"
skill   = "csv-parser"
input   = "{{ message.content }}"`,
    },
    {
      title: "Python SDK",
      language: "python",
      description: "Parse CSV data with custom delimiters and header options",
      code: `from nexus import SkillClient

client = SkillClient("csv-parser")

csv_data = """name,age,city
Alice,30,NYC
Bob,25,LA"""

result = client.invoke({
    "input": csv_data,
    "options": {"header": True, "delimiter": ","}
})

for row in result["rows"]:
    print(f"{row['name']} lives in {row['city']}")`,
    },
    {
      title: "CLI Usage",
      language: "bash",
      description: "Parse CSV files from the command line",
      code: `# Parse a CSV file
naos skill invoke csv-parser --file data.csv

# Custom delimiter
naos skill invoke csv-parser \\
  --file data.tsv \\
  --options '{"delimiter": "\\t"}'`,
    },
  ],
  "email-extractor": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Configure email extraction in your agent pipeline",
      code: `[agent.skills]
email-extractor = { version = "^1.0.0" }

[[agent.routes]]
pattern = "find emails in"
skill   = "email-extractor"
input   = "{{ message.content }}"`,
    },
    {
      title: "Python SDK",
      language: "python",
      description: "Extract and validate email addresses from text content",
      code: `from nexus import SkillClient

client = SkillClient("email-extractor")

result = client.invoke({
    "input": "Contact us at hello@nexus.dev or support@nexus.dev",
    "options": {"validate_mx": True, "deduplicate": True}
})

for email in result["emails"]:
    print(f"{email['address']} (valid: {email['mx_valid']})")`,
    },
  ],
  "sentiment-analyzer": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Add sentiment analysis to your agent's NLP pipeline",
      code: `[agent.skills]
sentiment-analyzer = { version = "^1.0.0" }

[[agent.routes]]
pattern = "analyze sentiment"
skill   = "sentiment-analyzer"
input   = "{{ message.content }}"`,
    },
    {
      title: "Python SDK",
      language: "python",
      description: "Analyze sentiment with confidence scores and aspect detection",
      code: `from nexus import SkillClient

client = SkillClient("sentiment-analyzer")

result = client.invoke({
    "input": "The new feature is amazing but the docs need work",
    "options": {"aspects": True, "language": "en"}
})

print(f"Overall: {result['sentiment']} ({result['confidence']:.0%})")
for aspect in result.get("aspects", []):
    print(f"  {aspect['topic']}: {aspect['sentiment']}")`,
    },
  ],
  "regex-matcher": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Configure regex matching in your agent",
      code: `[agent.skills]
regex-matcher = { version = "^1.0.0" }

[[agent.routes]]
pattern = "match regex"
skill   = "regex-matcher"
input   = "{{ message.content }}"`,
    },
    {
      title: "Rust SDK",
      language: "rust",
      description: "Use regex-matcher for high-performance pattern matching",
      code: `use nexus_sdk::SkillClient;

let client = SkillClient::new("regex-matcher")?;

let result = client.invoke(serde_json::json!({
    "input": "Order #12345 shipped on 2026-04-11",
    "patterns": [
        {"name": "order_id", "regex": "#(\\\\d+)"},
        {"name": "date", "regex": "\\\\d{4}-\\\\d{2}-\\\\d{2}"}
    ]
})).await?;

println!("Order: {}", result["matches"]["order_id"]);`,
    },
  ],
  "sql-builder": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Enable natural language to SQL conversion",
      code: `[agent.skills]
sql-builder = { version = "^1.0.0" }

[[agent.routes]]
pattern = "build SQL query"
skill   = "sql-builder"
input   = "{{ message.content }}"`,
    },
    {
      title: "Python SDK",
      language: "python",
      description: "Convert natural language queries to parameterized SQL",
      code: `from nexus import SkillClient

client = SkillClient("sql-builder")

result = client.invoke({
    "input": "Find all users older than 25 in New York",
    "schema": {
        "users": ["id", "name", "age", "city"]
    },
    "dialect": "postgresql"
})

print(f"SQL: {result['query']}")
print(f"Params: {result['params']}")
# SQL: SELECT * FROM users WHERE age > $1 AND city = $2
# Params: [25, "New York"]`,
    },
  ],
  "image-resizer": [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: "Add image processing to your agent pipeline",
      code: `[agent.skills]
image-resizer = { version = "^1.0.0" }

[[agent.routes]]
pattern = "resize image"
skill   = "image-resizer"
input   = "{{ message.attachments[0] }}"`,
    },
    {
      title: "CLI Usage",
      language: "bash",
      description: "Resize images from the command line with various options",
      code: `# Resize to specific dimensions
naos skill invoke image-resizer \\
  --file photo.jpg \\
  --options '{"width": 800, "height": 600, "fit": "cover"}'

# Batch resize with quality control
for img in *.png; do
  naos skill invoke image-resizer \\
    --file "$img" \\
    --options '{"width": 1200, "quality": 85, "format": "webp"}'
done`,
    },
  ],
};

/** Get usage examples for a skill, with fallback to generic examples */
export function getSkillUsageExamples(skillName: string): UsageExample[] {
  if (SKILL_USAGE_EXAMPLES[skillName]) return SKILL_USAGE_EXAMPLES[skillName];
  // Generic fallback
  return [
    {
      title: "Agent Config (TOML)",
      language: "toml",
      description: `Add ${skillName} to your agent's skill dependencies`,
      code: `[agent.skills]\n${skillName} = { version = "^1.0.0" }\n\n[[agent.routes]]\npattern = "use ${skillName}"\nskill   = "${skillName}"\ninput   = "{{ message.content }}"`,
    },
    {
      title: "CLI Usage",
      language: "bash",
      description: `Invoke ${skillName} from the command line`,
      code: `# Basic invocation\nnaos skill invoke ${skillName} --input "your data here"\n\n# With options\nnaos skill invoke ${skillName} \\\\\n  --input "your data" \\\\\n  --options '{"key": "value"}'`,
    },
  ];
}


/* ─── Publisher Profiles ──────────────────────────────────────────────────── */

export interface PublisherProfile {
  handle: string;
  displayName: string;
  email: string;
  bio: string;
  website?: string;
  github?: string;
  verified: boolean;
  joinedAt: string;
  auid: string;
  trustTier: TrustTier;
  creditRating: CreditRating;
  tScore: number;
  totalSkills: number;
  totalCalls: number;
  totalRevenue: number;
  avgRating: number;
  trustHistory: { date: string; tier: string; rating: string; tScore: number; event: string }[];
  badges: string[];
}

export const PUBLISHER_PROFILES: PublisherProfile[] = [
  {
    handle: "verified-dev",
    displayName: "Verified Dev",
    email: "dev@example.com",
    bio: "Building high-performance WASM skills for the Nexus ecosystem. Specializing in data parsing, transformation, and validation tools. All skills are MIT-licensed and thoroughly benchmarked.",
    website: "https://verified-dev.io",
    github: "verified-dev",
    verified: true,
    joinedAt: "2025-09-15",
    auid: "axis:company:dev:01hx7k2m3n4p5q6r7s8t9u0v1w:a3f7",
    trustTier: "T2",
    creditRating: "AAA",
    tScore: 94,
    totalSkills: 3,
    totalCalls: 4930000,
    totalRevenue: 717.70,
    avgRating: 4.7,
    trustHistory: [
      { date: "2025-09-15", tier: "T5", rating: "B", tScore: 20, event: "Account created, initial assessment" },
      { date: "2025-11-01", tier: "T4", rating: "BB", tScore: 45, event: "First skill published (json-parser v1.0.0)" },
      { date: "2025-12-20", tier: "T3", rating: "A", tScore: 62, event: "100K total calls milestone" },
      { date: "2026-02-01", tier: "T3", rating: "AA", tScore: 78, event: "Second skill published (csv-parser)" },
      { date: "2026-03-10", tier: "T2", rating: "AAA", tScore: 94, event: "1M total calls, zero security incidents" },
    ],
    badges: ["Early Adopter", "Million Calls Club", "Zero Incidents", "Top Publisher"],
  },
  {
    handle: "data-tools",
    displayName: "Data Tools Inc.",
    email: "team@data-tools.io",
    bio: "Enterprise-grade data extraction and validation tools. Our skills power thousands of production agents across finance, healthcare, and e-commerce verticals.",
    website: "https://data-tools.io",
    github: "data-tools-inc",
    verified: true,
    joinedAt: "2025-10-01",
    auid: "axis:company:dt:02hy8l3n4o5p6q7r8s9t0u1v2w:b4g8",
    trustTier: "T3",
    creditRating: "AA",
    tScore: 78,
    totalSkills: 2,
    totalCalls: 1890000,
    totalRevenue: 378.00,
    avgRating: 4.6,
    trustHistory: [
      { date: "2025-10-01", tier: "T5", rating: "B", tScore: 18, event: "Account created" },
      { date: "2025-12-15", tier: "T4", rating: "BB", tScore: 42, event: "email-extractor v1.0.0 published" },
      { date: "2026-02-10", tier: "T3", rating: "A", tScore: 65, event: "500K calls milestone" },
      { date: "2026-03-20", tier: "T3", rating: "AA", tScore: 78, event: "email-extractor v2.0.0, major update" },
    ],
    badges: ["Enterprise Ready", "500K Calls", "Verified Publisher"],
  },
  {
    handle: "utils",
    displayName: "Utils Collective",
    email: "hello@utils.dev",
    bio: "Open-source utility skills for everyday agent tasks. We believe in free, fast, and reliable tools that just work. Community-driven development with transparent benchmarks.",
    github: "utils-collective",
    verified: true,
    joinedAt: "2025-11-10",
    auid: "axis:community:uc:03iz9m4o5p6q7r8s9t0u1v2w3x:c5h9",
    trustTier: "T3",
    creditRating: "A",
    tScore: 68,
    totalSkills: 3,
    totalCalls: 2780000,
    totalRevenue: 139.00,
    avgRating: 4.4,
    trustHistory: [
      { date: "2025-11-10", tier: "T5", rating: "B", tScore: 15, event: "Account created" },
      { date: "2026-01-05", tier: "T4", rating: "BB", tScore: 38, event: "csv-parser v1.0.0 published" },
      { date: "2026-02-20", tier: "T3", rating: "A", tScore: 58, event: "date-parser and json-diff published" },
      { date: "2026-03-25", tier: "T3", rating: "A", tScore: 68, event: "1M total calls milestone" },
    ],
    badges: ["Open Source Champion", "Million Calls Club", "Community Favorite"],
  },
  {
    handle: "nlp-works",
    displayName: "NLP Works",
    email: "research@nlp-works.ai",
    bio: "AI/ML research lab building state-of-the-art natural language processing skills. Our sentiment analyzer is the most accurate on the marketplace, trained on 50M+ labeled samples.",
    website: "https://nlp-works.ai",
    github: "nlp-works",
    verified: true,
    joinedAt: "2025-10-20",
    auid: "axis:company:nlp:04ja0n5p6q7r8s9t0u1v2w3x4y:d6i0",
    trustTier: "T2",
    creditRating: "AAA",
    tScore: 91,
    totalSkills: 1,
    totalCalls: 3200000,
    totalRevenue: 1600.00,
    avgRating: 4.8,
    trustHistory: [
      { date: "2025-10-20", tier: "T5", rating: "B", tScore: 22, event: "Account created" },
      { date: "2025-12-01", tier: "T4", rating: "A", tScore: 55, event: "sentiment-analyzer v1.0.0 published" },
      { date: "2026-01-15", tier: "T3", rating: "AA", tScore: 72, event: "500K calls, top-rated skill" },
      { date: "2026-02-28", tier: "T2", rating: "AAA", tScore: 91, event: "2M calls, zero incidents, v3.0.0 released" },
    ],
    badges: ["AI Pioneer", "Top Rated", "2M Calls Club", "Research Lab"],
  },
  {
    handle: "converter",
    displayName: "Converter Labs",
    email: "info@converter.dev",
    bio: "Format conversion specialists. We build fast, reliable skills for transforming data between formats — Markdown, HTML, XML, CSV, and more.",
    github: "converter-labs",
    verified: false,
    joinedAt: "2026-01-05",
    auid: "axis:indie:cl:05kb1o6q7r8s9t0u1v2w3x4y5z:e7j1",
    trustTier: "T4",
    creditRating: "BB",
    tScore: 42,
    totalSkills: 1,
    totalCalls: 450000,
    totalRevenue: 45.00,
    avgRating: 4.2,
    trustHistory: [
      { date: "2026-01-05", tier: "T5", rating: "B", tScore: 12, event: "Account created" },
      { date: "2026-02-15", tier: "T4", rating: "BB", tScore: 42, event: "markdown-to-html v1.0.0 published" },
    ],
    badges: ["New Publisher"],
  },
  {
    handle: "patterns",
    displayName: "Pattern Systems",
    email: "dev@patterns.io",
    bio: "Text processing and pattern matching experts. Our regex-matcher is the fastest on the marketplace, compiled from hand-optimized Rust with zero-copy parsing.",
    website: "https://patterns.io",
    github: "pattern-systems",
    verified: true,
    joinedAt: "2025-12-01",
    auid: "axis:company:ps:06lc2p7r8s9t0u1v2w3x4y5z6a:f8k2",
    trustTier: "T3",
    creditRating: "A",
    tScore: 72,
    totalSkills: 1,
    totalCalls: 1100000,
    totalRevenue: 0,
    avgRating: 4.5,
    trustHistory: [
      { date: "2025-12-01", tier: "T5", rating: "B", tScore: 16, event: "Account created" },
      { date: "2026-01-20", tier: "T4", rating: "BB", tScore: 48, event: "regex-matcher v1.0.0 published" },
      { date: "2026-03-05", tier: "T3", rating: "A", tScore: 72, event: "1M calls, v2.0.0 released" },
    ],
    badges: ["Speed Champion", "Million Calls Club", "Open Source"],
  },
  {
    handle: "securenet",
    displayName: "SecureNet",
    email: "security@securenet.io",
    bio: "Security-focused validation skills. Every skill undergoes rigorous fuzzing and penetration testing before release. SOC2 compliant development process.",
    website: "https://securenet.io",
    github: "securenet-io",
    verified: true,
    joinedAt: "2025-11-15",
    auid: "axis:company:sn:07md3q8s9t0u1v2w3x4y5z6a7b:g9l3",
    trustTier: "T3",
    creditRating: "AA",
    tScore: 80,
    totalSkills: 2,
    totalCalls: 1750000,
    totalRevenue: 175.00,
    avgRating: 4.6,
    trustHistory: [
      { date: "2025-11-15", tier: "T5", rating: "B", tScore: 20, event: "Account created" },
      { date: "2026-01-10", tier: "T4", rating: "A", tScore: 55, event: "json-validator v1.0.0 published" },
      { date: "2026-02-25", tier: "T3", rating: "AA", tScore: 80, event: "url-validator published, SOC2 verified" },
    ],
    badges: ["Security Expert", "SOC2 Compliant", "Verified Publisher"],
  },
  {
    handle: "vision-ai",
    displayName: "Vision AI",
    email: "team@vision-ai.dev",
    bio: "Computer vision and image processing skills for AI agents. Our image-resizer uses SIMD-optimized WASM for near-native performance.",
    website: "https://vision-ai.dev",
    github: "vision-ai",
    verified: true,
    joinedAt: "2026-01-15",
    auid: "axis:company:va:08ne4r9t0u1v2w3x4y5z6a7b8c:h0m4",
    trustTier: "T4",
    creditRating: "A",
    tScore: 55,
    totalSkills: 1,
    totalCalls: 950000,
    totalRevenue: 285.00,
    avgRating: 4.3,
    trustHistory: [
      { date: "2026-01-15", tier: "T5", rating: "B", tScore: 15, event: "Account created" },
      { date: "2026-02-20", tier: "T4", rating: "BB", tScore: 38, event: "image-resizer v1.0.0 published" },
      { date: "2026-03-30", tier: "T4", rating: "A", tScore: 55, event: "500K calls milestone" },
    ],
    badges: ["Computer Vision", "SIMD Optimized"],
  },
  {
    handle: "querycraft",
    displayName: "QueryCraft",
    email: "dev@querycraft.io",
    bio: "Database and query building tools for AI agents. Our sql-builder generates safe, parameterized queries from natural language with support for PostgreSQL, MySQL, and SQLite.",
    website: "https://querycraft.io",
    github: "querycraft",
    verified: true,
    joinedAt: "2026-02-01",
    auid: "axis:company:qc:09of5s0u1v2w3x4y5z6a7b8c9d:i1n5",
    trustTier: "T4",
    creditRating: "BB",
    tScore: 48,
    totalSkills: 1,
    totalCalls: 780000,
    totalRevenue: 234.00,
    avgRating: 4.4,
    trustHistory: [
      { date: "2026-02-01", tier: "T5", rating: "B", tScore: 12, event: "Account created" },
      { date: "2026-03-10", tier: "T4", rating: "BB", tScore: 48, event: "sql-builder v1.0.0 published" },
    ],
    badges: ["Database Expert", "New Publisher"],
  },
];

function normalizeHandle(h: string): string {
  return h.replace(/^@/, "");
}

export function getPublisherProfile(handle: string): PublisherProfile | undefined {
  const norm = normalizeHandle(handle);
  return PUBLISHER_PROFILES.find((p) => normalizeHandle(p.handle) === norm);
}

export function getPublisherSkills(handle: string): Skill[] {
  const norm = normalizeHandle(handle);
  return SKILLS.filter((s) => normalizeHandle(s.publisher.handle) === norm);
}

/* ─── Skill Sandbox / Playground ──────────────────────────────────────────── */

export interface SandboxExample {
  label: string;
  input: string;
  expectedOutput: string;
  description: string;
}

export const SKILL_SANDBOX_EXAMPLES: Record<string, SandboxExample[]> = {
  "json-parser": [
    {
      label: "Basic Parse",
      input: '{"name": "Alice", "age": 30, "roles": ["admin", "user"]}',
      expectedOutput: '{\n  "name": "Alice",\n  "age": 30,\n  "roles": [\n    "admin",\n    "user"\n  ]\n}',
      description: "Parse and pretty-print a JSON object",
    },
    {
      label: "JQ Query",
      input: '{"data": {"users": [{"name": "Alice"}, {"name": "Bob"}]}}\n---\n.data.users[].name',
      expectedOutput: '[\n  "Alice",\n  "Bob"\n]',
      description: "Extract nested values using JQ-like query syntax",
    },
    {
      label: "Array Filter",
      input: '{"items": [{"price": 10}, {"price": 25}, {"price": 5}]}\n---\n.items[] | select(.price > 8)',
      expectedOutput: '[\n  {"price": 10},\n  {"price": 25}\n]',
      description: "Filter array elements by condition",
    },
    {
      label: "Error Handling",
      input: '{"name": "Alice", age: 30}',
      expectedOutput: 'Error at line 1, col 18: Expected string key, got identifier "age"\nHint: JSON keys must be quoted strings',
      description: "Graceful error handling with line/column indicators",
    },
  ],
  "email-extractor": [
    {
      label: "Basic Extract",
      input: "Contact us at support@example.com or sales@company.io for more info.",
      expectedOutput: '[\n  {"email": "support@example.com", "valid": true, "domain": "example.com"},\n  {"email": "sales@company.io", "valid": true, "domain": "company.io"}\n]',
      description: "Extract email addresses from plain text",
    },
    {
      label: "HTML Content",
      input: '<a href="mailto:john@startup.dev">John</a> and <a href="mailto:jane@corp.com">Jane</a>',
      expectedOutput: '[\n  {"email": "john@startup.dev", "valid": true, "domain": "startup.dev"},\n  {"email": "jane@corp.com", "valid": true, "domain": "corp.com"}\n]',
      description: "Extract emails from HTML content",
    },
    {
      label: "Validation",
      input: "Real: user@domain.com, Invalid: not-an-email, Tricky: user@.com",
      expectedOutput: '[\n  {"email": "user@domain.com", "valid": true, "domain": "domain.com"},\n  {"email": "user@.com", "valid": false, "reason": "Invalid domain"}\n]',
      description: "Extract and validate email addresses",
    },
  ],
  "csv-parser": [
    {
      label: "Basic CSV",
      input: "name,age,city\nAlice,30,NYC\nBob,25,LA\nCharlie,35,Chicago",
      expectedOutput: '[\n  {"name": "Alice", "age": 30, "city": "NYC"},\n  {"name": "Bob", "age": 25, "city": "LA"},\n  {"name": "Charlie", "age": 35, "city": "Chicago"}\n]',
      description: "Parse CSV with automatic type inference",
    },
    {
      label: "Quoted Fields",
      input: 'name,bio\n"Alice","Loves ""coding"" and data"\n"Bob","Works at Acme, Inc."',
      expectedOutput: '[\n  {"name": "Alice", "bio": "Loves \\"coding\\" and data"},\n  {"name": "Bob", "bio": "Works at Acme, Inc."}\n]',
      description: "Handle quoted fields with escaped characters",
    },
  ],
  "sentiment-analyzer": [
    {
      label: "Positive",
      input: "This product is absolutely amazing! Best purchase I've ever made.",
      expectedOutput: '{\n  "sentiment": "positive",\n  "confidence": 0.96,\n  "emotions": {"joy": 0.82, "surprise": 0.15},\n  "language": "en"\n}',
      description: "Analyze positive sentiment with emotion detection",
    },
    {
      label: "Negative",
      input: "Terrible experience. The service was slow and the staff was rude.",
      expectedOutput: '{\n  "sentiment": "negative",\n  "confidence": 0.93,\n  "emotions": {"anger": 0.65, "disgust": 0.28},\n  "language": "en"\n}',
      description: "Detect negative sentiment and specific emotions",
    },
    {
      label: "Multi-language",
      input: "Ce restaurant est fantastique! La nourriture était délicieuse.",
      expectedOutput: '{\n  "sentiment": "positive",\n  "confidence": 0.91,\n  "emotions": {"joy": 0.78, "satisfaction": 0.20},\n  "language": "fr"\n}',
      description: "Multi-language sentiment analysis (French)",
    },
  ],
  "regex-matcher": [
    {
      label: "Email Pattern",
      input: "Text: hello@world.com and test@example.org\n---\nPattern: [\\w.+-]+@[\\w-]+\\.[\\w.]+",
      expectedOutput: '{\n  "matches": ["hello@world.com", "test@example.org"],\n  "count": 2,\n  "positions": [[6, 21], [26, 42]]\n}',
      description: "Match email addresses using regex pattern",
    },
    {
      label: "Named Groups",
      input: "Date: 2026-04-11\n---\nPattern: (?P<year>\\d{4})-(?P<month>\\d{2})-(?P<day>\\d{2})",
      expectedOutput: '{\n  "matches": ["2026-04-11"],\n  "groups": {"year": "2026", "month": "04", "day": "11"}\n}',
      description: "Extract named capture groups",
    },
  ],
  "markdown-to-html": [
    {
      label: "Basic Markdown",
      input: "# Hello World\\n\\nThis is **bold** and *italic*.\\n\\n- Item 1\\n- Item 2",
      expectedOutput: '<h1>Hello World</h1>\\n<p>This is <strong>bold</strong> and <em>italic</em>.</p>\\n<ul>\\n<li>Item 1</li>\\n<li>Item 2</li>\\n</ul>',
      description: "Convert basic Markdown to HTML",
    },
  ],
  "json-validator": [
    {
      label: "Valid JSON",
      input: '{"name": "Alice", "age": 30}',
      expectedOutput: '{\n  "valid": true,\n  "schema": {"type": "object", "properties": {"name": "string", "age": "number"}}\n}',
      description: "Validate JSON and infer schema",
    },
    {
      label: "Invalid JSON",
      input: '{name: "Alice", age: 30}',
      expectedOutput: '{\n  "valid": false,\n  "errors": [\n    {"line": 1, "col": 2, "message": "Expected string key"},\n    {"line": 1, "col": 17, "message": "Expected string key"}\n  ]\n}',
      description: "Detect and report JSON validation errors",
    },
  ],
};

export function getSkillSandboxExamples(skillName: string): SandboxExample[] {
  return SKILL_SANDBOX_EXAMPLES[skillName] || [];
}

/* ─── Advanced Filter Helpers ─────────────────────────────────────────────── */

export interface FilterState {
  priceMin: number | null;
  priceMax: number | null;
  minTrustTier: TrustTier | null;
  minRating: number | null;
  maxWasmSize: number | null;
  pricingModel: PricingModel | "all";
}

export const TRUST_TIER_ORDER: TrustTier[] = ["T1", "T2", "T3", "T4", "T5"];

export function parseWasmSizeKB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*(KB|MB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  return match[2].toUpperCase() === "MB" ? val * 1024 : val;
}

export function filterSkills(skills: Skill[], filters: FilterState): Skill[] {
  return skills.filter((s) => {
    // Price filter
    const price = s.pricing.pricePerCall ?? 0;
    if (filters.priceMin !== null && price < filters.priceMin) return false;
    if (filters.priceMax !== null && price > filters.priceMax) return false;

    // Pricing model
    if (filters.pricingModel !== "all" && s.pricing.model !== filters.pricingModel) return false;

    // Trust tier (lower number = higher trust)
    if (filters.minTrustTier) {
      const skillIdx = TRUST_TIER_ORDER.indexOf(s.trust.trustTier || "T5");
      const filterIdx = TRUST_TIER_ORDER.indexOf(filters.minTrustTier);
      if (skillIdx > filterIdx) return false;
    }

    // Rating
    if (filters.minRating !== null && s.stats.rating < filters.minRating) return false;

    // WASM size
    if (filters.maxWasmSize !== null) {
      const sizeKB = parseWasmSizeKB(s.wasmSize);
      if (sizeKB > filters.maxWasmSize) return false;
    }

    return true;
  });
}
