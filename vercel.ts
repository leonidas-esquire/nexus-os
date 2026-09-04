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
    routes.rewrite("/install.sh", `${railwayBackend}/install.sh`),
    routes.rewrite("/blog", `${railwayBackend}/blog`),
    routes.rewrite("/blog/(.*)", `${railwayBackend}/blog/$1`),
    routes.rewrite("/(.*)", "/index.html"),
  ],
  headers: [
    routes.header("/assets/(.*)", [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ]),
    routes.header("/(.*)", [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]),
  ],
};
