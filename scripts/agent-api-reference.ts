type ProcedureReference = {
  name: string;
  kind: "query" | "mutation";
  access: "public" | "public-token" | "public-origin-scoped" | "admin";
  input: unknown;
  output: unknown;
  description: string;
};

type ReferenceOptions = {
  canonicalOrigin: string;
  apiOrigin: string;
  generatedAt: string;
};

export const trpcProcedures: ProcedureReference[] = [
  { name: "system.health", kind: "query", access: "public", input: { timestamp: "number >= 0" }, output: { ok: true }, description: "Typed application health probe." },
  { name: "system.notifyOwner", kind: "mutation", access: "admin", input: { title: "non-empty string", content: "non-empty string" }, output: { success: "boolean" }, description: "Send an operational notification to the project owner." },
  { name: "auth.me", kind: "query", access: "public", input: null, output: "Authenticated user context or null", description: "Return the current Clerk-backed application user." },
  { name: "auth.logout", kind: "mutation", access: "public", input: null, output: { success: true }, description: "Return an application logout acknowledgement; client sign-out remains Clerk-managed." },
  { name: "blog.list", kind: "query", access: "public", input: null, output: "Published BlogPost[]", description: "List up to 50 published posts." },
  { name: "blog.featured", kind: "query", access: "public", input: null, output: "BlogPost | null", description: "Return the featured published post." },
  { name: "blog.getBySlug", kind: "query", access: "public", input: { slug: "string" }, output: "BlogPost", description: "Return a published post by slug." },
  { name: "adminBlog.list", kind: "query", access: "admin", input: { limit: "integer 1..100 = 20", offset: "integer >= 0 = 0" }, output: "Admin BlogPost[]", description: "List posts for administration." },
  { name: "adminBlog.getById", kind: "query", access: "admin", input: { id: "number" }, output: "BlogPost", description: "Return a post by numeric identifier." },
  { name: "adminBlog.upsert", kind: "mutation", access: "admin", input: "Blog draft or publication fields; see server/blogRouter.ts", output: { id: "number", slug: "string" }, description: "Create or update a Markdown blog post." },
  { name: "adminBlog.delete", kind: "mutation", access: "admin", input: { id: "number", title: "optional string" }, output: { success: true }, description: "Delete a blog post." },
  { name: "adminBlog.previewToken", kind: "mutation", access: "admin", input: "Draft title, excerpt, content, and optional metadata", output: { token: "string" }, description: "Create a short-lived preview token." },
  { name: "adminBlog.getPreview", kind: "query", access: "public-token", input: { token: "string" }, output: "Preview draft object", description: "Resolve a short-lived preview draft token." },
  { name: "showcase.list", kind: "query", access: "public", input: { category: "optional string", search: "optional string", sort: "upvotes | newest | stars", limit: "integer 1..50 = 20", offset: "integer >= 0 = 0" }, output: "Paginated approved project collection", description: "List approved showcase projects." },
  { name: "showcase.featured", kind: "query", access: "public", input: null, output: "ShowcaseProject[]", description: "List featured showcase projects." },
  { name: "showcase.getBySlug", kind: "query", access: "public", input: { slug: "string" }, output: "Approved ShowcaseProject", description: "Return an approved or featured project." },
  { name: "showcase.categoryCounts", kind: "query", access: "public", input: null, output: "Category count collection", description: "Return approved project counts by category." },
  { name: "showcase.related", kind: "query", access: "public", input: { projectId: "string", category: "string" }, output: "ShowcaseProject[]", description: "Return related approved projects." },
  { name: "showcase.upvote", kind: "mutation", access: "public-origin-scoped", input: { projectId: "string" }, output: "Upvote toggle result", description: "Toggle a network-origin-scoped upvote." },
  { name: "showcase.hasUpvoted", kind: "query", access: "public", input: { projectId: "string" }, output: "boolean", description: "Check whether the requester origin has upvoted a project." },
  { name: "showcaseSubmit.submit", kind: "mutation", access: "public", input: "Title, tagline, description, screenshot URL, author email, category, and optional links", output: { success: true, id: "string", slug: "string" }, description: "Submit a project for moderation." },
  { name: "adminShowcase.list", kind: "query", access: "admin", input: { status: "optional string", search: "optional string", limit: "integer 1..100 = 20", offset: "integer >= 0 = 0" }, output: "Administrative project collection", description: "List showcase submissions for moderation." },
  { name: "adminShowcase.pending", kind: "query", access: "admin", input: null, output: "Pending ShowcaseProject[]", description: "List pending showcase submissions." },
  { name: "adminShowcase.approve", kind: "mutation", access: "admin", input: { id: "string" }, output: { success: true }, description: "Approve a showcase project." },
  { name: "adminShowcase.feature", kind: "mutation", access: "admin", input: { id: "string", featured: "boolean" }, output: { success: true }, description: "Set featured status." },
  { name: "adminShowcase.reject", kind: "mutation", access: "admin", input: { id: "string" }, output: { success: true }, description: "Reject a showcase project." },
  { name: "adminShowcase.delete", kind: "mutation", access: "admin", input: { id: "string" }, output: { success: true }, description: "Delete a showcase project." },
  { name: "adminShowcase.update", kind: "mutation", access: "admin", input: "Project identifier plus optional editable project fields", output: { success: true }, description: "Update a showcase project." },
];

export function buildOpenApiDocument(options: ReferenceOptions): string {
  const { canonicalOrigin, apiOrigin, generatedAt } = options;
  const textResponse = (description: string, contentType: string) => ({
    description,
    content: { [contentType]: { schema: { type: "string" } } },
  });
  const document = {
    openapi: "3.1.0",
    info: {
      title: "AI Agents Nexus REST API",
      version: "0.3.1",
      description: `Contract for conventional REST and document endpoints. The separate tRPC surface is documented at ${canonicalOrigin}/api-reference/trpc.md.`,
      license: { name: "Apache-2.0", identifier: "Apache-2.0", url: "https://www.apache.org/licenses/LICENSE-2.0" },
    },
    servers: [{ url: apiOrigin, description: "Canonical production API" }],
    externalDocs: { description: "tRPC procedure reference", url: `${canonicalOrigin}/api-reference/trpc.md` },
    tags: [
      { name: "Operations", description: "Service status and installation" },
      { name: "Discovery", description: "Sitemaps and API descriptions" },
      { name: "Blog", description: "Public blog feeds and administrative media upload" },
      { name: "Showcase", description: "Public showcase media upload" },
    ],
    paths: {
      "/api/health": { get: { tags: ["Operations"], operationId: "getHealth", summary: "Check service health", responses: { "200": { description: "Service is accepting requests.", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } } } } },
      "/install.sh": { get: { tags: ["Operations"], operationId: "getInstallScript", summary: "Download the portable naos installer", responses: { "200": textResponse("Shell installer source.", "text/plain") } } },
      "/api/sitemap.xml": { get: { tags: ["Discovery"], operationId: "getSitemap", summary: "Get the canonical public-site sitemap", responses: { "200": textResponse("Complete public-site XML sitemap.", "application/xml") } } },
      "/openapi.json": { get: { tags: ["Discovery"], operationId: "getOpenApiDocument", summary: "Get this OpenAPI contract", responses: { "200": { description: "OpenAPI 3.1 document.", content: { "application/json": { schema: { type: "object" } } } } } } },
      "/api/blog/feed.xml": { get: { tags: ["Blog"], operationId: "getBlogFeed", summary: "Get the public Atom blog feed", responses: { "200": textResponse("Atom 1.0 feed of published posts.", "application/atom+xml") } } },
      "/api/blog/sitemap.xml": { get: { deprecated: true, tags: ["Blog"], operationId: "getLegacyBlogSitemap", summary: "Get the legacy blog sitemap", description: "Prefer /api/sitemap.xml for complete coverage.", responses: { "200": textResponse("Blog sitemap XML.", "application/xml") } } },
      "/api/blog/upload-image": {
        post: {
          tags: ["Blog"], operationId: "uploadBlogImage", summary: "Upload an administrative blog image", security: [{ ClerkBearer: [] }],
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["image"], properties: { image: { type: "string", format: "binary", description: "JPEG, PNG, WebP, GIF, or AVIF up to 100 MB." } } } } } },
          responses: { "200": { $ref: "#/components/responses/UploadSuccess" }, "400": { $ref: "#/components/responses/BadRequest" }, "403": { description: "Administrator session required." }, "500": { $ref: "#/components/responses/ServerError" } },
        },
      },
      "/api/showcase/upload-image": {
        post: {
          tags: ["Showcase"], operationId: "uploadShowcaseImage", summary: "Upload a public showcase image",
          requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["image"], properties: { image: { type: "string", format: "binary", description: "JPEG, PNG, WebP, GIF, or AVIF up to 10 MB." } } } } } },
          responses: { "200": { $ref: "#/components/responses/UploadSuccess" }, "400": { $ref: "#/components/responses/BadRequest" }, "500": { $ref: "#/components/responses/ServerError" } },
        },
      },
    },
    components: {
      securitySchemes: { ClerkBearer: { type: "http", scheme: "bearer", bearerFormat: "Clerk session JWT", description: "Clerk bearer token; administrator role is required where stated." } },
      schemas: {
        HealthResponse: { type: "object", required: ["status", "service", "timestamp"], properties: { status: { type: "string", const: "ok" }, service: { type: "string", const: "nexus-site" }, timestamp: { type: "string", format: "date-time" } } },
        UploadResponse: { type: "object", required: ["url", "key"], properties: { url: { type: "string", format: "uri" }, key: { type: "string" } } },
        ErrorResponse: { type: "object", properties: { error: { type: "string" } } },
      },
      responses: {
        UploadSuccess: { description: "Image stored successfully.", content: { "application/json": { schema: { $ref: "#/components/schemas/UploadResponse" } } } },
        BadRequest: { description: "Missing image or unsupported format.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        ServerError: { description: "Server could not complete the request.", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
    "x-nexus-generated": { at: generatedAt, source: "server/_core/index.ts", verification: "process:agent-readability-regression-tests" },
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function buildTrpcReferenceMarkdown(options: ReferenceOptions): string {
  const { canonicalOrigin, apiOrigin, generatedAt } = options;
  const rows = trpcProcedures.map(item => `| \`${item.name}\` | ${item.kind} | ${item.access} | ${item.description} |`).join("\n");
  return [
    "---",
    'title: "Nexus OS tRPC Procedure Reference"',
    'description: "Agent-facing reference for Nexus OS tRPC namespaces, procedure kinds, access levels, inputs, and outputs."',
    `resource: ${canonicalOrigin}/api-reference/trpc.md`,
    `generated: { by: "process:nexus-agent-assets", at: ${generatedAt} }`,
    "status: stable",
    "---",
    "",
    "# Nexus OS tRPC Procedure Reference",
    "",
    `The typed RPC endpoint is **${apiOrigin}/api/trpc**. It uses tRPC 11 request encoding and SuperJSON serialization. Agents should use a compatible tRPC client rather than treating these procedures as conventional REST operations. Where authentication is required, send a Clerk session token as an HTTP Bearer token.`,
    "",
    `The machine-readable companion is [trpc-procedures.json](${canonicalOrigin}/api-reference/trpc-procedures.json). The conventional REST surface is described by [OpenAPI](${apiOrigin}/openapi.json).`,
    "",
    "| Procedure | Kind | Access | Purpose |",
    "|---|---|---|---|",
    rows,
    "",
    "## Access levels",
    "",
    "| Access | Meaning |",
    "|---|---|",
    "| public | No authenticated user is required. |",
    "| public-token | A short-lived capability token is required in the procedure input. |",
    "| public-origin-scoped | Public mutation whose persistence key derives from the requester network address. |",
    "| admin | A valid Clerk session mapped to an application administrator is required. |",
    "",
    "## Source and verification",
    "",
    `Generated from \`server/routers.ts\`, \`server/blogRouter.ts\`, \`server/showcaseRouter.ts\`, and \`server/_core/systemRouter.ts\` at ${generatedAt}.`,
    "",
  ].join("\n");
}

export function buildTrpcProceduresDocument(options: ReferenceOptions): string {
  return `${JSON.stringify({ schemaVersion: "1.0", generatedAt: options.generatedAt, endpoint: `${options.apiOrigin}/api/trpc`, transport: "tRPC 11 with SuperJSON", source: ["server/routers.ts", "server/blogRouter.ts", "server/showcaseRouter.ts", "server/_core/systemRouter.ts"], procedures: trpcProcedures }, null, 2)}\n`;
}
