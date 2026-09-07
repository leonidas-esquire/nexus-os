import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

/**
 * Replace default meta tags in the HTML template with SSR-injected blog meta.
 */
function injectBlogMeta(html: string, metaTags: string): string {
  let result = html;
  // Remove existing title tag
  result = result.replace(/<title>[^<]*<\/title>/, "");
  // Remove existing og: and twitter: meta tags and description
  result = result.replace(
    /<meta\s+(?:property="og:|name="twitter:|name="description"|name="robots")[^>]*\/?>\s*/g,
    ""
  );
  result = result.replace(
    /<link\s+rel="(?:canonical|alternate|describedby)"[^>]*\/?>\s*/g,
    ""
  );
  result = result.replace(
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/g,
    ""
  );
  // Insert new meta tags after <head>
  result = result.replace(/<head>/, `<head>\n    ${metaTags}`);
  return result;
}

export function injectAgentBody(html: string, body?: string): string {
  if (!body) return html;
  return html.replace(
    /<div id="root">[\s\S]*<\/div>\s*(?=<script)/,
    `<div id="root">${body}</div>\n    `
  );
}

export function isAgentResourceRequest(url: string): boolean {
  const pathname = new URL(url, "http://localhost").pathname;
  return (
    pathname.startsWith("/.well-known/") ||
    /\.(?:md|txt|json|ya?ml|xml)$/i.test(pathname) ||
    /^\/(?:ai-plugin|openapi|swagger|asyncapi|manifest)(?:\.|$)/i.test(pathname)
  );
}

function sendAgentResourceNotFound(req: Request, res: Response): void {
  res
    .status(404)
    .set({
      "Content-Type": "application/problem+json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    })
    .send({
      type: "https://www.aiagents.nexus/knowledge/governance/content-provenance.md",
      title: "Machine-readable resource not found",
      status: 404,
      detail: `No agent resource is published at ${req.path}`,
      alternatives: [
        "https://www.aiagents.nexus/llms.txt",
        "https://www.aiagents.nexus/knowledge/index.md",
        "https://api.aiagents.nexus/openapi.json",
      ],
    });
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (isAgentResourceRequest(url)) {
      sendAgentResourceNotFound(req, res);
      return;
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      // Inject SSR meta tags if set by blog middleware
      if (res.locals.blogMeta) {
        template = injectBlogMeta(template, res.locals.blogMeta);
      }
      template = injectAgentBody(template, res.locals.agentBody);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    const pathname = new URL(req.originalUrl, "http://localhost").pathname;
    if (path.extname(pathname)) {
      next();
      return;
    }
    const routeIndex = path.resolve(distPath, `.${pathname}`, "index.html");
    if (
      !routeIndex.startsWith(`${distPath}${path.sep}`) ||
      !fs.existsSync(routeIndex)
    ) {
      next();
      return;
    }

    if (res.locals.blogMeta || res.locals.agentBody) {
      let html = fs.readFileSync(routeIndex, "utf-8");
      if (res.locals.blogMeta) {
        html = injectBlogMeta(html, res.locals.blogMeta);
      }
      html = injectAgentBody(html, res.locals.agentBody);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
      return;
    }

    res.sendFile(routeIndex);
  });

  app.use(express.static(distPath, { redirect: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    if (isAgentResourceRequest(req.originalUrl)) {
      sendAgentResourceNotFound(req, res);
      return;
    }
    const indexPath = path.resolve(distPath, "index.html");
    // Inject SSR meta tags if set by blog middleware
    if (res.locals.blogMeta) {
      let html = fs.readFileSync(indexPath, "utf-8");
      html = injectBlogMeta(html, res.locals.blogMeta);
      html = injectAgentBody(html, res.locals.agentBody);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } else {
      res.sendFile(indexPath);
    }
  });
}
