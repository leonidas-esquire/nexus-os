# Nexus OS Website Deployment

> **Recommended topology:** Vercel serves the compiled Vite frontend and proxies dynamic routes to a single Railway service running the Express application.

This repository remains compatible with Manus hosting. The external-host configuration is additive: `vercel.ts` is read by Vercel, while `.railway/railway.ts` is read by the Railway CLI. The existing `pnpm build` and `pnpm start` commands remain unchanged for Manus and Railway.

## Architecture

| Request | Vercel behavior | Railway behavior |
|---|---|---|
| `/`, `/docs`, `/showcase`, and other SPA routes | Serves `public/index.html` and hashed assets | Also serves the complete application when visited directly |
| `/api/*` | Reverse-proxies the request to Railway, preserving Clerk bearer tokens | Runs Express, Clerk middleware, tRPC, feeds, uploads, and database access |
| `/blog` and `/blog/*` | Reverse-proxies to preserve server-injected Open Graph metadata | Runs the blog SSR metadata middleware before serving the SPA |
| `/install.sh` | Reverse-proxies to Railway | Returns the shell installer with `text/plain` content type |
| Scheduled blog publishing | Not run on Vercel | Runs in the persistent Railway Node process |

Vercel supports external-origin rewrites and programmatic configuration through `vercel.ts`; the latter allows the Railway origin to come from an environment variable rather than source code.[1] [2] Railway supports GitHub-sourced Express services with explicit build, start, and health-check settings through its Infrastructure-as-Code workflow.[3] [4]

## 1. Deploy the Express Application to Railway

The Railway deployment is the system of record for dynamic behavior. It builds both the Vite frontend and Express server, then starts `dist/index.js` through the existing `pnpm start` script.

### Required Railway variables

Configure these in the Railway service's **Variables** panel. Do not commit their values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | MySQL/TiDB-compatible connection string used by Drizzle. Do **not** attach Railway Postgres without also migrating the schema and driver. |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key used by Express middleware when verifying incoming Clerk sessions. |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret used for token verification and first-login user synchronization. Never expose it to the browser. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Same Clerk publishable key, embedded into the Vite bundle when Railway builds the complete application. |
| `CLERK_AUTHORIZED_PARTIES` | Recommended | Comma-separated allowed frontend origins, such as `https://aiagents.nexus,https://www.aiagents.nexus`, used to restrict accepted session-token origins. |
| `CLERK_ADMIN_EMAILS` | Recommended for initial admin | Comma-separated Clerk email addresses that should receive the local `admin` role. |
| `CLERK_ADMIN_USER_IDS` | Alternative admin mapping | Comma-separated Clerk user IDs that should receive the local `admin` role. Clerk `publicMetadata.role = "admin"` is also supported. |
| `BUILT_IN_FORGE_API_URL` | Yes for uploads | Manus storage-proxy origin used by blog and showcase image uploads. |
| `BUILT_IN_FORGE_API_KEY` | Yes for uploads | Server-side bearer credential for the Manus storage proxy. |
| `VITE_FRONTEND_FORGE_API_URL` | Only for browser Forge integrations | Browser-facing Forge API origin. |
| `VITE_FRONTEND_FORGE_API_KEY` | Only for browser Forge integrations | Browser Forge credential injected at build time. |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Analytics script origin referenced by `client/index.html`. |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Analytics website identifier. |
| `NODE_ENV` | Recommended | Set to `production`. |
| `PORT` | Automatic | Railway injects this variable; the server listens on it. |

Clerk is the portable identity provider for Vercel and Railway. The React application obtains a Clerk session token, the tRPC client sends it as a bearer token, and Clerk Express middleware verifies it before the local user record is synchronized.[7] [8] File storage remains coupled to the Manus Forge proxy until a portable object-storage integration is configured.

### Railway deployment steps

First, install and authenticate the Railway CLI, then clone the repository if it is not already on your computer. From the repository root, run:

```bash
railway login
railway link
railway config plan
railway config apply
```

The CLI automatically discovers `.railway/railway.ts`. Review the plan carefully before applying it; Railway intentionally requires confirmation before creating or changing infrastructure.[3]

After applying the configuration, add the environment variables listed above in Railway, trigger a deployment, and generate a public domain for the `nexus-site` service. Verify the service before configuring Vercel:

```bash
curl -fsS https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health
```

The expected response contains `"status":"ok"` and `"service":"nexus-site"`.

## 2. Deploy the Frontend to Vercel

Import `leonidas-esquire/nexus-os` into Vercel. The repository's `vercel.ts` configuration runs `pnpm build:vercel`, writes the Vite output to the root `public/` directory, and creates external rewrites for the API, blog metadata routes, and installer.

### Required Vercel variables

| Variable | Required | Purpose |
|---|---:|---|
| `RAILWAY_BACKEND_URL` | Yes | Public Railway service origin, with no trailing slash; used by `vercel.ts` for proxy rewrites. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key for `ClerkProvider`; use the production key when cutting over production domains. |
| `VITE_FRONTEND_FORGE_API_URL` | Only for browser Forge integrations | Browser-facing Forge API origin. |
| `VITE_FRONTEND_FORGE_API_KEY` | Only for browser Forge integrations | Browser Forge credential injected during the build. |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Analytics script origin. |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Analytics website identifier. |

Set `RAILWAY_BACKEND_URL` for **Production**, **Preview**, and **Development** if every Vercel environment should share the same backend. For isolated preview data, point Preview deployments at a separate Railway environment instead.

Once the variables are set, deploy from the Vercel dashboard or run the following commands from the repository root:

```bash
vercel
vercel --prod
```

Vercel Functions scale with traffic, and Vercel's Express support packages an Express application as a function. This project deliberately avoids that mode because `express.static()` is ignored by Vercel's Express runtime and the blog publisher currently relies on a persistent process.[5] [6] The Vercel deployment is therefore the static frontend and edge proxy; Railway remains the stateful application server.

## 3. Configure the Production Domain

Use only one public edge for `aiagents.nexus` to avoid inconsistent cookies and cache behavior. For the recommended topology, connect `aiagents.nexus` and `www.aiagents.nexus` to Vercel, while keeping the Railway-generated domain as the private application origin used by `RAILWAY_BACKEND_URL`.

After DNS has propagated, verify these flows through the Vercel domain:

```bash
curl -fsS https://aiagents.nexus/api/health
curl -fsSI https://aiagents.nexus/install.sh
curl -fsSI https://aiagents.nexus/api/blog/feed.xml
```

Then verify the homepage, `/docs`, `/blog`, `/showcase`, Clerk sign-in, user synchronization, an authenticated admin request, and an image upload in the browser.

## 4. Compatibility Notes

| Area | Current behavior | External-host action |
|---|---|---|
| **Database** | Drizzle uses the MySQL driver | Reuse the current MySQL/TiDB database or provision a compatible MySQL service. |
| **Authentication** | Clerk React and Express with bearer-token tRPC requests | Configure matching Clerk keys on Vercel and Railway; restrict `CLERK_AUTHORIZED_PARTIES` to the production frontend origins. |
| **File storage** | Uses the Manus Forge storage proxy, not direct AWS S3 | Supply Forge credentials or replace `server/storage.ts` with portable S3-compatible storage. |
| **Scheduled publishing** | A 60-second in-process timer runs inside Express | Supported by a persistent Railway service; not reliable in a Vercel Function that can scale to zero.[6] |
| **Uploads through Vercel** | Rewritten directly to Railway | Avoids Vercel Function request-body limits because the rewrite targets the Railway origin instead of a function. |
| **Blog social metadata** | Injected by Express middleware | `/blog` and `/blog/*` are proxied to Railway rather than served solely as static SPA routes. |

## 5. Rollback

Vercel and Railway both preserve deployment history. If the external rollout fails, leave the existing Manus-hosted deployment active, remove the external DNS records, and restore the previous DNS target. Do not point production traffic at both hosts simultaneously.

## Current Railway Backend

The production Railway backend is live at `https://nexus-os-production-6fd0.up.railway.app`. Railway builds the Node 22 application through the root `railpack.json`, runs `pnpm exec drizzle-kit migrate` before each deployment, and gates releases on `/api/health`.

| Component | Current status |
|---|---|
| Express backend | Online and healthy |
| MySQL | Online, linked through `DATABASE_URL`, and migrated |
| Authentication | Clerk is live on Railway; production sign-in, bearer-token verification, and MySQL user synchronization are verified |
| Owner/admin identity | The project owner is mapped through `CLERK_ADMIN_USER_IDS`; `auth.me`, `/admin/blog`, and `/admin/showcase` are verified with role `admin` |
| Public API, Atom feed, installer | Verified over the Railway domain |
| Image uploads and owner notifications | Require a portable external storage/API credential or replacement integration |

The former temporary PostgreSQL service and its volume were removed after MySQL validation. The Clerk migration is merged in PR #10 and GitHub Actions run 33984128365 passed. Do not copy the Manus sandbox's injected Forge credential to Railway; configure an independently portable credential or replace the upload/notification integration before relying on those flows externally. Vercel still needs `VITE_CLERK_PUBLISHABLE_KEY` and `RAILWAY_BACKEND_URL` when its frontend project is created.

## References

[1]: https://vercel.com/docs/routing/rewrites "Vercel — Rewrites"
[2]: https://vercel.com/docs/project-configuration/vercel-ts "Vercel — Programmatic Configuration with vercel.ts"
[3]: https://docs.railway.com/infrastructure-as-code "Railway — Infrastructure as Code"
[4]: https://docs.railway.com/infrastructure-as-code/reference "Railway — Infrastructure as Code Reference"
[5]: https://vercel.com/docs/frameworks/backend/express "Vercel — Express on Vercel"
[6]: https://vercel.com/docs/functions "Vercel — Functions lifecycle"
[7]: https://clerk.com/docs/react/getting-started/quickstart "Clerk — React Quickstart"
[8]: https://clerk.com/docs/reference/express/clerk-middleware "Clerk — Express clerkMiddleware"
