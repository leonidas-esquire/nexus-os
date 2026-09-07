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
