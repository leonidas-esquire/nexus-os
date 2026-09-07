import { createHash } from "node:crypto";
import { MAX_PACKAGE_BYTES, manifestSchema } from "../../shared/marketplace";

export class RegistryError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// Structural checks only. Never instantiate untrusted code in the web server.
export async function validatePackage(input: unknown, bytes: Buffer) {
  const parsed = manifestSchema.safeParse(input);
  if (!parsed.success)
    throw new RegistryError(
      400,
      parsed.error.issues
        .map(i => `${i.path.join(".")}: ${i.message}`)
        .join("; ")
    );
  if (bytes.length < 8 || bytes.length > MAX_PACKAGE_BYTES)
    throw new RegistryError(
      400,
      "Package must be a WASM binary of at most 16 MiB"
    );
  let module: WebAssembly.Module;
  try {
    module = await WebAssembly.compile(new Uint8Array(bytes));
  } catch {
    throw new RegistryError(400, "Invalid WASM binary");
  }
  const exports = WebAssembly.Module.exports(module);
  if (
    !exports.some(e => e.name === "_start" && e.kind === "function") ||
    !exports.some(e => e.name === "memory" && e.kind === "memory")
  ) {
    throw new RegistryError(
      400,
      "Export _start and memory for the WASIp1 command runtime"
    );
  }
  if (
    WebAssembly.Module.imports(module).some(
      i => i.module !== "wasi_snapshot_preview1" || i.kind !== "function"
    )
  ) {
    throw new RegistryError(400, "Only WASIp1 function imports are supported");
  }
  return {
    manifest: parsed.data,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
  };
}
