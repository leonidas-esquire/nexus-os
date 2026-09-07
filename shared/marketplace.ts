import { z } from "zod";

export const MAX_PACKAGE_BYTES = 16 * 1024 * 1024;
export const skillName = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)
  .max(64);
export const skillVersion = z
  .string()
  .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
  .max(32);
export const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: skillName,
    version: skillVersion,
    description: z.string().trim().min(10).max(500),
    readme: z.string().trim().min(20).max(20000),
    inputs: z.string().trim().min(10).max(2000),
    outputs: z.string().trim().min(10).max(2000),
    examples: z
      .array(
        z
          .object({ input: z.string().max(2000), output: z.string().max(2000) })
          .strict()
      )
      .min(1)
      .max(3),
    license: z.string().trim().min(1).max(100),
    category: z.enum([
      "Validators",
      "Parsers",
      "Transformers",
      "Calculators",
      "Data",
      "Other",
    ]),
    runtime: z.literal("wasip1-command"),
    entrypoint: z.literal("_start"),
    pricing: z.literal("free"),
  })
  .strict();
export type SkillManifest = z.infer<typeof manifestSchema>;
export type RegistryVersion = {
  id: number;
  name: string;
  version: string;
  manifest: SkillManifest;
  sha256: string;
  size: number;
  status: "pending" | "approved" | "rejected" | "revoked";
  ownerId: number;
  publisher: string;
  createdAt: string;
  reviewReason: string | null;
};

export const registryVersionSchema = z.object({
  id: z.number().int().positive(),
  name: skillName,
  version: skillVersion,
  manifest: manifestSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  size: z.number().int().min(8).max(MAX_PACKAGE_BYTES),
  status: z.enum(["pending", "approved", "rejected", "revoked"]),
  ownerId: z.number().int(),
  publisher: z.string(),
  createdAt: z.iso.datetime(),
  reviewReason: z.string().nullable(),
});
export const registryQuerySchema = z.object({
  q: z.string().max(100).default(""),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export const registryReviewSchema = z
  .object({
    action: z.enum(["approved", "rejected", "revoked"]),
    reason: z.string().trim().min(10).max(2000),
  })
  .strict();
export const registryListSchema = z.object({
  items: z.array(registryVersionSchema),
});
export const registrySubmissionSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal("pending"),
  name: skillName,
  version: skillVersion,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
