import {
  manifestSchema,
  registryVersionSchema,
  registryReviewSchema,
  registryListSchema,
  registrySubmissionSchema,
} from "../shared/marketplace";
import { jsonSchema } from "./api-schema";
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const response = (name: string) => ({
  description: "Successful response",
  content: { "application/json": { schema: ref(name) } },
});
const errors = Object.fromEntries(
  Object.entries({
    400: "Invalid fields, JSON, or package; correct the request",
    401: "Missing or expired Clerk token",
    403: "Owner or administrator permission required",
    404: "No approved resource exists at this URL",
    409: "Immutable version conflict or invalid review transition",
    429: "Submission quota or request concurrency limit; retry later",
    503: "Database or package storage unavailable; retry later",
  }).map(([code, description]) => [
    code,
    {
      description,
      content: { "application/json": { schema: ref("ErrorResponse") } },
    },
  ])
);
const parameter = (name: string, pattern: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", pattern },
});
const name = parameter("name", "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$");
const version = parameter(
  "version",
  "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$"
);
const page = [
  {
    name: "offset",
    in: "query",
    schema: { type: "integer", minimum: 0, maximum: 100000, default: 0 },
  },
];
const auth = [{ ClerkBearer: [] }];
const get = (
  id: string,
  summary: string,
  schema: string,
  parameters: unknown[] = [],
  secured = false
) => ({
  get: {
    operationId: id,
    summary,
    parameters,
    ...(secured ? { security: auth } : {}),
    responses: { 200: response(schema), ...errors },
  },
});
export function marketplaceSchemas() {
  return {
    SkillManifest: jsonSchema(manifestSchema),
    RegistryVersion: jsonSchema(registryVersionSchema, "output"),
    RegistryList: jsonSchema(registryListSchema, "output"),
    RegistrySubmission: jsonSchema(registrySubmissionSchema, "output"),
    RegistryReview: jsonSchema(registryReviewSchema),
    Success: {
      type: "object",
      required: ["success"],
      properties: { success: { type: "boolean" } },
    },
  };
}
export function marketplaceOpenApiPaths() {
  const download = (id: string, secured = false) => ({
    get: {
      operationId: id,
      summary: secured
        ? "Administrator inspection download"
        : "Download approved WASM (approval checked on every request)",
      parameters: [name, version],
      ...(secured ? { security: auth } : {}),
      responses: {
        200: {
          description:
            "Raw WASM binary; at most 16 MiB; verify size and SHA-256 from the release metadata",
          content: {
            "application/wasm": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        ...errors,
      },
    },
  });
  return {
    "/api/marketplace/skills": get(
      "listSkills",
      "Approved releases, newest submission first; 50 per page",
      "RegistryList",
      [
        { name: "q", in: "query", schema: { type: "string", maxLength: 100 } },
        ...page,
      ]
    ),
    "/api/marketplace/skills/{name}": get(
      "latestSkill",
      "Most recently submitted approved release; pin a version for reproducibility",
      "RegistryVersion",
      [name]
    ),
    "/api/marketplace/skills/{name}/{version}": get(
      "getSkillRelease",
      "Immutable approved release metadata",
      "RegistryVersion",
      [name, version]
    ),
    "/api/marketplace/skills/{name}/{version}/package":
      download("downloadSkill"),
    "/api/marketplace/skills/{name}/{version}/manifest": get(
      "downloadManifest",
      "Manifest of an approved release",
      "SkillManifest",
      [name, version]
    ),
    "/api/marketplace/mine": get(
      "mySkillReleases",
      "Signed-in developer’s releases, including pending and rejected",
      "RegistryList",
      page,
      true
    ),
    "/api/marketplace/review": get(
      "reviewQueue",
      "Administrator release review list",
      "RegistryList",
      page,
      true
    ),
    "/api/marketplace/review/{name}/{version}/package": download(
      "inspectSkill",
      true
    ),
    "/api/marketplace/publish": {
      post: {
        operationId: "submitSkill",
        summary:
          "Submit an immutable free WASIp1 release for manual review; does not publish immediately",
        security: auth,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["manifest", "wasm"],
                properties: {
                  manifest: {
                    type: "string",
                    maxLength: 25000,
                    description:
                      "JSON-encoded SkillManifest; maximum 25 KB UTF-8",
                    contentMediaType: "application/json",
                    contentSchema: ref("SkillManifest"),
                  },
                  wasm: {
                    type: "string",
                    format: "binary",
                    description: "WASIp1 binary, maximum 16 MiB",
                  },
                },
              },
            },
          },
        },
        responses: { 201: response("RegistrySubmission"), ...errors },
      },
    },
    "/api/marketplace/review/{id}": {
      post: {
        operationId: "reviewSkill",
        summary:
          "Administrator: pending → approved/rejected; approved → revoked. Notes required.",
        security: auth,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("RegistryReview") } },
        },
        responses: { 200: response("Success"), ...errors },
      },
    },
  };
}
