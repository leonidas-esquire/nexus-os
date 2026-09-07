# Marketplace phase 1: publishing and installation

This phase replaces the routed mock marketplace with a persistent, free-skill registry. Paid pricing is rejected by the manifest schema. Checkout, marketplace commissions, payouts, hosted execution billing, reviews/ratings, and dependency resolution are later milestones. No revenue split is enforced in this phase.

## Publish → review → install

1. Build a binary WASIp1 command exporting `_start` and `memory`. The runner supports stdin/stdout with no inherited filesystem, environment, or network. Compile the existing example with:
   ```sh
   cargo build --manifest-path examples/deterministic-agent/Cargo.toml --target wasm32-wasip1 --release
   ```
2. Sign in at `/marketplace/developer`, enter the package metadata and README, and upload the `.wasm` file. A successful submission is **pending**, not publicly available.
3. A Clerk-authenticated administrator visits `/marketplace/admin`, downloads the private package, inspects its manifest/code, and verifies its documented behavior in the Nexus sandbox. Approve or reject with review notes. Approved versions can subsequently be revoked.
4. Browse approved releases at `/marketplace`. Use a CLI built from this change:
   ```sh
   naos marketplace search record
   naos marketplace install record-total@1.0.0
   ```
   Installation prints the actual local package path and a `naos create NAME --source PATH` command. Run that agent with `naos run NAME --input FILE`. Execution thereafter does not contact the registry or require an LLM. Downloads alone do not register an agent or execute code in the browser.

Names are lowercase slugs up to 64 characters. Versions use `major.minor.patch` (no leading zeros). Publishing reserves a name to the signed-in developer. Every release is immutable, including rejected or revoked releases; corrections require a new version. An unpinned install selects the most recently submitted approved release, not the numerically highest semantic version. Pin versions for reproducibility.

## Optional CLI publishing

Place `manifest.json` and `skill.wasm` in a directory. Set `NEXUS_REGISTRY_TOKEN` to a current Clerk session JWT for the same application, then run `naos marketplace publish DIRECTORY`. The web portal is the recommended login/upload flow; this release does not implement persistent CLI login. Never put tokens in manifests or source control.

```json
{
  "schemaVersion": 1,
  "name": "record-total",
  "version": "1.0.0",
  "description": "Validate records and total integer amounts without an LLM.",
  "readme": "Input: JSON with a records array. Each record requires a unique nonempty id and nonnegative integer amount_cents. Output: valid, record_count, and total_cents. Invalid records produce a nonzero exit.",
  "inputs": "JSON containing records with unique ids and nonnegative integer amount_cents.",
  "outputs": "JSON totals, or a nonzero exit code for invalid records.",
  "examples": [{"input":"{\"records\":[]}","output":"{\"valid\":true,\"record_count\":0,\"total_cents\":0}"}],
  "license": "MIT",
  "category": "Validators",
  "runtime": "wasip1-command",
  "entrypoint": "_start",
  "pricing": "free"
}
```

## Storage and rollout

Apply migration `0006` to the **Railway MySQL database** before deploying the new server. Back up the database first; the migration creates three new tables without changing existing data. Run `pnpm exec drizzle-kit migrate` with the target `DATABASE_URL`. Deployment does not automatically migrate or seed the database.

Configure the Railway server with:

| Variable                                     | Purpose                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`                               | Existing MySQL database                                     |
| `MARKETPLACE_S3_BUCKET`                      | Private bucket for WASM packages, required in production    |
| `MARKETPLACE_S3_ENDPOINT`                    | Optional S3-compatible endpoint, e.g. Cloudflare R2         |
| `AWS_REGION`                                 | Bucket region; defaults to `auto` for R2                    |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Server-only object credentials, or an AWS workload identity |
| Existing Clerk variables                     | Verified sessions and configured administrator IDs          |

Keep the bucket private. The server proxies downloads and rechecks approval on every request; there are no public object URLs. Grant the server GetObject/PutObject only on `marketplace/sha256/*`. Use provider encryption and backups. No S3 object ACL is made public.

In non-production development, files default to `.marketplace-packages/` (gitignored). Override with `MARKETPLACE_LOCAL_STORAGE`. Production fails closed without S3 configuration; ephemeral Railway disk is not a package store. `NEXUS_REGISTRY_URL` selects a registry origin for CLI testing; HTTPS is required except for loopback development. The Vercel frontend already proxies `/api/*` to Railway.

The web release and rebuilt CLI must both ship. Existing downloadable CLI releases predate this feature. Updating the website alone does not update installed CLI binaries. Do not announce installation support until the new CLI is released.

## Integrity, limits, and review

- The server validates the manifest, WASM binary, exported command/memory and WASIp1-only function imports. It computes SHA-256 itself. It **does not execute** untrusted code or claim an automated security audit; administrator sandbox verification remains a release gate.
- Uploads are limited to 16 MiB, manifest fields to 25 KB, 10 successful submissions per developer per rolling 24 hours, and 8 concurrent registry requests per server process. Enforce account creation controls and upstream rate limits at the deployment edge as traffic grows; per-account quotas do not limit the number of accounts.
- MySQL transactions serialize ownership, release creation, and quota checks. Storage failure rolls back metadata. An object written before a later transaction failure can be orphaned; periodically reconcile unreferenced objects with a grace period before removal. Do not lifecycle-delete referenced approved packages.
- Package bytes are private and addressed by SHA-256. Both server downloads and CLI installs verify the stored size/digest. The CLI bounds network responses, disallows redirects, validates WASM, writes atomically, and records the actual path only after success.
- Review decisions are transactional and persisted with actor, reason and timestamp. Rejection/revocation hides metadata and downloads publicly. Revocation does not erase copies already installed offline.
- The catalog and developer/admin lists paginate in batches of 50. Public results contain approved versions only. Owners see their own submissions; administrators see all versions.
- All registry responses disable caching so approval changes take effect at the API. Production auth uses Clerk; mutation routes require bearer tokens.

## Verification

`pnpm check`, `pnpm build`, `pnpm exec vitest run server/marketplace` cover type/build checks, package validation, storage, and HTTP access controls. Set `TEST_MARKETPLACE_DATABASE_URL` to a **disposable empty MySQL database** to include migration, ownership, concurrent submission, review, rollback and quota tests. Tests must never point at production. The marketplace CI workflow supplies MySQL 8 and runs these integration cases.

`cargo test --all-targets` includes a registry HTTP fixture that installs a hash-verified package, creates an agent from it, executes it with model credentials removed, and rejects tampered, unapproved and unsafe-path packages.

Release descriptions must now include inputs, outputs, and at least one example. The marketplace is not yet deployed, so this required manifest expansion does not rewrite any published release. The CLI defaults to the canonical API origin to avoid the apex-to-www redirect. See AI_AGENT_READABILITY.md for live documentation paths and freshness automation.
