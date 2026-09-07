import { readFileSync } from "node:fs";
import { appRouter } from "../server/routers";
import { z } from "zod";
import { jsonSchema } from "./api-schema";
import {
  marketplaceOpenApiPaths,
  marketplaceSchemas,
} from "./marketplace-api-reference";
type ProcedureReference = { name: string; description: string };

type ReferenceOptions = {
  canonicalOrigin: string;
  apiOrigin: string;
  generatedAt: string;
};

const descriptions: ProcedureReference[] = [
  {
    name: "system.health",
    description: "Typed application health probe.",
  },
  {
    name: "system.notifyOwner",
    description: "Send an operational notification to the project owner.",
  },
  {
    name: "auth.me",
    description: "Return the current Clerk-backed application user.",
  },
  {
    name: "auth.logout",
    description:
      "Return an application logout acknowledgement; client sign-out remains Clerk-managed.",
  },
  {
    name: "blog.list",
    description: "List up to 50 published posts.",
  },
  {
    name: "blog.featured",
    description: "Return the featured published post.",
  },
  {
    name: "blog.getBySlug",
    description: "Return a published post by slug.",
  },
  {
    name: "adminBlog.list",
    description: "List posts for administration.",
  },
  {
    name: "adminBlog.getById",
    description: "Return a post by numeric identifier.",
  },
  {
    name: "adminBlog.upsert",
    description: "Create or update a Markdown blog post.",
  },
  {
    name: "adminBlog.delete",
    description: "Delete a blog post.",
  },
  {
    name: "adminBlog.previewToken",
    description: "Create a short-lived preview token.",
  },
  {
    name: "adminBlog.getPreview",
    description: "Resolve a short-lived preview draft token.",
  },
  {
    name: "showcase.list",
    description: "List approved showcase projects.",
  },
  {
    name: "showcase.featured",
    description: "List featured showcase projects.",
  },
  {
    name: "showcase.getBySlug",
    description: "Return an approved or featured project.",
  },
  {
    name: "showcase.categoryCounts",
    description: "Return approved project counts by category.",
  },
  {
    name: "showcase.related",
    description: "Return related approved projects.",
  },
  {
    name: "showcase.upvote",
    description: "Toggle a network-origin-scoped upvote.",
  },
  {
    name: "showcase.hasUpvoted",
    description: "Check whether the requester origin has upvoted a project.",
  },
  {
    name: "showcaseSubmit.submit",
    description: "Submit a project for moderation.",
  },
  {
    name: "adminShowcase.list",
    description: "List showcase submissions for moderation.",
  },
  {
    name: "adminShowcase.pending",
    description: "List pending showcase submissions.",
  },
  {
    name: "adminShowcase.approve",
    description: "Approve a showcase project.",
  },
  {
    name: "adminShowcase.feature",
    description: "Set featured status.",
  },
  {
    name: "adminShowcase.reject",
    description: "Reject a showcase project.",
  },
  {
    name: "adminShowcase.delete",
    description: "Delete a showcase project.",
  },
  {
    name: "adminShowcase.update",
    description: "Update a showcase project.",
  },
];

export function procedureContracts() {
  const procedures = appRouter._def.procedures;
  const names = Object.keys(procedures).sort();
  if (
    names.join() !==
    descriptions
      .map(p => p.name)
      .sort()
      .join()
  )
    throw new Error("tRPC documentation coverage drift");
  return names.map(name => {
    const procedure = procedures[name as keyof typeof procedures];
    const definition = procedure._def;
    if (!definition.meta?.access)
      throw new Error(`Missing access contract for ${name}`);
    if (!definition.output)
      throw new Error(`Missing output contract for ${name}`);
    const description = descriptions.find(p => p.name === name)!;
    return {
      name,
      kind: definition.type,
      access: definition.meta?.access,
      description: description.description,
      inputSchema: jsonSchema((definition.inputs[0] || z.null()) as z.ZodType),
      inputRequired: definition.inputs.length > 0,
      outputSchema: jsonSchema(definition.output as z.ZodType, "output"),
      errors: [
        "BAD_REQUEST",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "INTERNAL_SERVER_ERROR",
      ],
    };
  });
}
export const trpcProcedures = procedureContracts();

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
      version:
        readFileSync("knowledge/product/release.md", "utf8").match(
          /\*\*v([\d.]+)\*\*/
        )?.[1] || "unknown",
      description: `Contract for conventional REST and document endpoints. The separate tRPC surface is documented at ${canonicalOrigin}/api-reference/trpc.md.`,
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
    },
    servers: [{ url: apiOrigin, description: "Canonical production API" }],
    externalDocs: {
      description: "tRPC procedure reference",
      url: `${canonicalOrigin}/api-reference/trpc.md`,
    },
    tags: [
      { name: "Operations", description: "Service status and installation" },
      { name: "Discovery", description: "Sitemaps and API descriptions" },
      {
        name: "Blog",
        description: "Public blog feeds and administrative media upload",
      },
      { name: "Showcase", description: "Public showcase media upload" },
    ],
    paths: {
      ...marketplaceOpenApiPaths(),
      "/api/blog/{slug}.md": {
        get: {
          operationId: "getBlogMarkdown",
          summary: "Full published blog Markdown",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": textResponse("Full published post", "text/markdown"),
            "404": { description: "Post is not published or does not exist" },
            "503": { description: "Database unavailable" },
          },
        },
      },
      "/docs-markdown/blog/{slug}.md": {
        get: {
          operationId: "getBlogDocument",
          summary: "Published blog Markdown alias",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": textResponse("Full published post", "text/markdown"),
            "404": { description: "No published post" },
            "503": { description: "Database unavailable" },
          },
        },
      },
      "/docs-markdown/showcase/{slug}.md": {
        get: {
          operationId: "getShowcaseDocument",
          summary: "Full approved showcase Markdown",
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": textResponse("Full approved project", "text/markdown"),
            "404": { description: "No approved project" },
            "503": { description: "Database unavailable" },
          },
        },
      },
      "/docs-markdown/site/marketplace.md": {
        get: {
          operationId: "getMarketplaceDocument",
          summary: "Live approved catalog; 50 per page",
          parameters: [
            {
              name: "offset",
              in: "query",
              schema: {
                type: "integer",
                minimum: 0,
                maximum: 100000,
                default: 0,
              },
            },
          ],
          responses: {
            "200": textResponse(
              "Live approved releases with links to version documents",
              "text/markdown"
            ),
            "400": { description: "Invalid offset" },
            "503": { description: "Database unavailable" },
          },
        },
      },
      "/docs-markdown/marketplace/{name}/{version}.md": {
        get: {
          operationId: "getSkillDocument",
          summary: "Complete immutable approved release documentation",
          parameters: [
            {
              name: "name",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "version",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": textResponse(
              "Complete version-specific skill document",
              "text/markdown"
            ),
            "400": { description: "Invalid identifier" },
            "404": { description: "No approved version" },
            "503": { description: "Database unavailable" },
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["Operations"],
          operationId: "getHealth",
          summary: "Check service health",
          responses: {
            "200": {
              description: "Service is accepting requests.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/install.sh": {
        get: {
          tags: ["Operations"],
          operationId: "getInstallScript",
          summary: "Download the portable naos installer",
          responses: {
            "200": textResponse("Shell installer source.", "text/plain"),
          },
        },
      },
      "/api/sitemap.xml": {
        get: {
          tags: ["Discovery"],
          operationId: "getSitemap",
          summary: "Get the canonical public-site sitemap",
          responses: {
            "200": textResponse(
              "Complete public-site XML sitemap.",
              "application/xml"
            ),
          },
        },
      },
      "/openapi.json": {
        get: {
          tags: ["Discovery"],
          operationId: "getOpenApiDocument",
          summary: "Get this OpenAPI contract",
          responses: {
            "200": {
              description: "OpenAPI 3.1 document.",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/blog/feed.xml": {
        get: {
          tags: ["Blog"],
          operationId: "getBlogFeed",
          summary: "Get the public Atom blog feed",
          responses: {
            "200": textResponse(
              "Atom 1.0 feed of published posts.",
              "application/atom+xml"
            ),
          },
        },
      },
      "/api/blog/sitemap.xml": {
        get: {
          deprecated: true,
          tags: ["Blog"],
          operationId: "getLegacyBlogSitemap",
          summary: "Get the legacy blog sitemap",
          description: "Prefer /api/sitemap.xml for complete coverage.",
          responses: {
            "308": {
              description: "Permanent redirect to /api/sitemap.xml",
              headers: { Location: { schema: { type: "string" } } },
            },
          },
        },
      },
      "/api/blog/upload-image": {
        post: {
          tags: ["Blog"],
          operationId: "uploadBlogImage",
          summary: "Upload an administrative blog image",
          security: [{ ClerkBearer: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: {
                      type: "string",
                      format: "binary",
                      description:
                        "JPEG, PNG, WebP, GIF, or AVIF up to 100 MB.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/UploadSuccess" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "403": { description: "Administrator session required." },
            "500": { $ref: "#/components/responses/ServerError" },
          },
        },
      },
      "/api/showcase/upload-image": {
        post: {
          tags: ["Showcase"],
          operationId: "uploadShowcaseImage",
          summary: "Upload a public showcase image",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: {
                      type: "string",
                      format: "binary",
                      description: "JPEG, PNG, WebP, GIF, or AVIF up to 10 MB.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { $ref: "#/components/responses/UploadSuccess" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "500": { $ref: "#/components/responses/ServerError" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        ClerkBearer: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Clerk session JWT",
          description:
            "Clerk bearer token; administrator role is required where stated.",
        },
      },
      schemas: {
        ...marketplaceSchemas(),
        HealthResponse: {
          type: "object",
          required: ["status", "service", "timestamp"],
          properties: {
            status: { type: "string", const: "ok" },
            service: { type: "string", const: "nexus-site" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        UploadResponse: {
          type: "object",
          required: ["url", "key"],
          properties: {
            url: { type: "string", format: "uri" },
            key: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
      responses: {
        UploadSuccess: {
          description: "Image stored successfully.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UploadResponse" },
            },
          },
        },
        BadRequest: {
          description: "Missing image or unsupported format.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ServerError: {
          description: "Server could not complete the request.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    "x-nexus-generated": {
      at: generatedAt,
      source: "server/_core/index.ts",
      generation:
        "Schema extraction; test results are published separately by CI",
    },
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function buildTrpcReferenceMarkdown(options: ReferenceOptions): string {
  const { canonicalOrigin, apiOrigin, generatedAt } = options;
  const rows = trpcProcedures
    .map(
      item =>
        `| \`${item.name}\` | ${item.kind} | ${item.access} | ${item.description} |`
    )
    .join("\n");
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
    "## Request examples",
    "",
    "Using @trpc/client with superjson (queries do not mutate state):",
    "```ts",
    "import { createTRPCUntypedClient, httpBatchLink } from '@trpc/client';",
    "import superjson from 'superjson';",
    `const client = createTRPCUntypedClient({ links: [httpBatchLink({ url: '${apiOrigin}/api/trpc', transformer: superjson })] });`,
    "const health = await client.query('system.health', { timestamp: Date.now() });",
    "const posts = await client.query('blog.list');",
    "```",
    "",
    "JSON Schemas describe the logical payload; Date fields carry x-superjson-type: Date. Pass JavaScript Date values through the SuperJSON client. Plain JSON timestamps alone do not satisfy a Zod date input. tRPC returns its standard result/error envelope; schemas describe the decoded result data.",
    "",
    "Mutation calls use client.mutation(name, input). They may publish, delete, or notify; authenticate and obtain the appropriate application authority before invoking them. HTTP error codes follow tRPC conventions. Never place a token in a URL.",
    "",
    ...trpcProcedures.flatMap(p => [
      `## ${p.name}`,
      p.description,
      `Access: ${p.access}. Kind: ${p.kind}. Input required: ${p.inputRequired}.`,
      "### Input JSON Schema",
      "```json",
      JSON.stringify(p.inputSchema, null, 2),
      "```",
      "### Output JSON Schema",
      "```json",
      JSON.stringify(p.outputSchema, null, 2),
      "```",
      "",
    ]),
    "## Source and verification",
    "",
    `Generated from \`server/routers.ts\`, \`server/blogRouter.ts\`, \`server/showcaseRouter.ts\`, and \`server/_core/systemRouter.ts\` at ${generatedAt}.`,
    "",
  ].join("\n");
}

export function buildTrpcProceduresDocument(options: ReferenceOptions): string {
  return `${JSON.stringify({ schemaVersion: "1.0", generatedAt: options.generatedAt, endpoint: `${options.apiOrigin}/api/trpc`, transport: "tRPC 11 with SuperJSON", source: ["server/routers.ts", "server/blogRouter.ts", "server/showcaseRouter.ts", "server/_core/systemRouter.ts"], procedures: trpcProcedures }, null, 2)}\n`;
}
