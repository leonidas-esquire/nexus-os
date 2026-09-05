import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { feedRouter } from "../blogFeedRoutes";
import { blogUploadRouter } from "../blogUploadRoute";
import { showcaseUploadRouter } from "../showcaseUploadRoute";
import { startScheduledJobs, stopScheduledJobs } from "../scheduledJobs";
import { registerBlogSsrMiddleware } from "../blogSsrMiddleware";
import { installScriptRouter } from "../installScriptRoute";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    clerkMiddleware({
      publishableKey: ENV.clerkPublishableKey,
      secretKey: ENV.clerkSecretKey,
      ...(ENV.clerkAuthorizedParties.length > 0
        ? { authorizedParties: ENV.clerkAuthorizedParties }
        : {}),
    })
  );
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Liveness endpoint used by Railway and external uptime monitors.
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "nexus-site",
      timestamp: new Date().toISOString(),
    });
  });
  // Blog image upload (multipart/form-data via multer — must come before tRPC)
  app.use(blogUploadRouter);
  // Showcase image upload (public, no auth required)
  app.use(showcaseUploadRouter);
  // Blog Atom feed and sitemap routes
  app.use(feedRouter);
  // Install script route — serves /install.sh with text/plain content-type
  app.use(installScriptRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Blog SSR middleware — injects OG/Twitter meta tags for crawlers
  // Must come BEFORE Vite/static catch-all
  registerBlogSsrMiddleware(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start scheduled jobs (e.g. auto-publish scheduled posts)
  startScheduledJobs();

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  const shutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}; shutting down gracefully`);
    stopScheduledJobs();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(console.error);
