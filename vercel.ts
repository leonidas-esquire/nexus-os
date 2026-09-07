import {
  deploymentEnv,
  routes,
  type VercelConfig,
} from "@vercel/config/v1";

/**
 * Vercel hosts the Vite frontend while Railway hosts the stateful Express app.
 * Set RAILWAY_BACKEND_URL in Vercel without a trailing slash, for example:
 * https://nexus-os-production.up.railway.app
 */
const railwayBackend = deploymentEnv("RAILWAY_BACKEND_URL");

export const config: VercelConfig = {
  framework: null,
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: "pnpm build:vercel",
  outputDirectory: "public",
  rewrites: [
    routes.rewrite("/api/(.*)", `${railwayBackend}/api/$1`),
    routes.rewrite("/sitemap.xml", `${railwayBackend}/api/sitemap.xml`),
    routes.rewrite("/openapi.json", `${railwayBackend}/openapi.json`),
    routes.rewrite("/.well-known/(.*)", `${railwayBackend}/.well-known/$1`),
    routes.rewrite("/(.*).(json|xml|yaml|yml|md|txt)", `${railwayBackend}/$1.$2`),
    routes.rewrite("/install.sh", `${railwayBackend}/install.sh`),
    routes.rewrite("/blog", `${railwayBackend}/blog`),
    routes.rewrite("/blog/(.*)", `${railwayBackend}/blog/$1`),
    routes.rewrite("/showcase", `${railwayBackend}/showcase`),
    routes.rewrite("/showcase/(.*)", `${railwayBackend}/showcase/$1`),
    routes.rewrite("/docs", "/docs/index.html"),
    routes.rewrite("/docs/(.*)", "/docs/$1/index.html"),
    routes.rewrite("/marketplace", "/marketplace/index.html"),
    routes.rewrite("/marketplace/(.*)", "/marketplace/$1/index.html"),
    routes.rewrite("/legal", "/legal/index.html"),
    routes.rewrite("/legal/(.*)", "/legal/$1/index.html"),
    routes.rewrite("/(.*)", "/index.html"),
  ],
  headers: [
    routes.header("/assets/(.*)", [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ]),
    routes.header("/knowledge/(.*)", [
      { key: "Content-Type", value: "text/markdown; charset=utf-8" },
      { key: "Cache-Control", value: "public, max-age=300" },
    ]),
    routes.header("/docs-markdown/(.*)", [
      { key: "Content-Type", value: "text/markdown; charset=utf-8" },
      { key: "Cache-Control", value: "public, max-age=300" },
    ]),
    routes.header("/llms.txt", [
      { key: "Content-Type", value: "text/plain; charset=utf-8" },
      { key: "Cache-Control", value: "public, max-age=300" },
    ]),
    routes.header("/llms-full.txt", [
      { key: "Content-Type", value: "text/plain; charset=utf-8" },
      { key: "Cache-Control", value: "public, max-age=300" },
    ]),
    routes.header("/(.*)", [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]),
  ],
};
