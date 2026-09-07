import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { MAX_PACKAGE_BYTES } from "../../shared/marketplace";
import { RegistryError } from "./package";

export interface PackageStore {
  put(hash: string, bytes: Buffer): Promise<void>;
  get(hash: string): Promise<Buffer>;
}
const key = (hash: string) => {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid package digest");
  return `marketplace/sha256/${hash}.wasm`;
};
export function packageStore(): PackageStore {
  const bucket = process.env.MARKETPLACE_S3_BUCKET;
  if (bucket) {
    const client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: process.env.MARKETPLACE_S3_ENDPOINT,
      forcePathStyle: true,
    });
    return {
      async put(hash, bytes) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key(hash),
            Body: bytes,
            ContentType: "application/wasm",
          })
        );
      },
      async get(hash) {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key(hash) })
        );
        if (!response.Body || (response.ContentLength ?? 0) > MAX_PACKAGE_BYTES)
          throw new Error("Invalid stored package");
        // Stream with a bound even if object metadata is absent or corrupted.
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          size += chunk.length;
          if (size > MAX_PACKAGE_BYTES)
            throw new Error("Stored package too large");
          chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      },
    };
  }
  if (process.env.NODE_ENV === "production")
    throw new RegistryError(
      503,
      "Marketplace package storage is not configured"
    );
  const root = resolve(
    process.env.MARKETPLACE_LOCAL_STORAGE || ".marketplace-packages"
  );
  return {
    async put(hash, bytes) {
      const path = join(root, key(hash));
      await mkdir(join(root, "marketplace/sha256"), { recursive: true });
      try {
        await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    },
    async get(hash) {
      return readFile(join(root, key(hash)));
    },
  };
}
export async function verifiedPackage(
  store: PackageStore,
  hash: string,
  size: number
) {
  const bytes = await store.get(hash);
  if (
    bytes.length !== size ||
    createHash("sha256").update(bytes).digest("hex") !== hash
  )
    throw new RegistryError(503, "Stored package integrity check failed");
  return bytes;
}
