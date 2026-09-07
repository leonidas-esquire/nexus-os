import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { z } from "zod";
import { authenticateClerkRequest } from "../_core/clerkAuth";
import type { User } from "../../drizzle/schema";
import {
  registryQuerySchema,
  registryReviewSchema,
  registryVersionSchema,
  MAX_PACKAGE_BYTES,
  skillName,
  skillVersion,
} from "../../shared/marketplace";
import { RegistryError, validatePackage } from "./package";
import { packageStore, verifiedPackage } from "./storage";
import * as repository from "./repository";

// Dependency injection supports HTTP tests without bypassing production auth.
export function createMarketplaceRouter(
  authenticate = authenticateClerkRequest,
  repo = repository,
  storage = packageStore
) {
  const router = Router();
  // Bound aggregate upload/download memory per web process.
  let active = 0;
  router.use("/api/marketplace", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (active >= 8) {
      res
        .status(429)
        .set("Retry-After", "5")
        .json({ error: "Registry is busy; retry shortly" });
      return;
    }
    active++;
    let released = false;
    const release = () => {
      if (!released) {
        active--;
        released = true;
      }
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAX_PACKAGE_BYTES,
      files: 1,
      fields: 1,
      fieldSize: 25000,
      parts: 3,
    },
  }).single("wasm");
  const wrap =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
      void fn(req, res).catch(next);
    };
  const requireUser = (req: Request, res: Response, next: NextFunction) => {
    if (
      req.method !== "GET" &&
      !req.headers.authorization?.startsWith("Bearer ")
    ) {
      res.status(401).json({ error: "A Clerk bearer token is required" });
      return;
    }
    // Fail before accepting a large multipart body. Authentication uses Clerk's verified session.
    void authenticate(req)
      .then(user => {
        res.locals.user = user;
        next();
      })
      .catch(() => res.status(401).json({ error: "Sign in to continue" }));
  };
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    requireUser(req, res, () =>
      res.locals.user.role === "admin"
        ? next()
        : res.status(403).json({ error: "Administrator access required" })
    );
  };
  const query = registryQuerySchema;
  router.get(
    "/api/marketplace/skills",
    wrap(async (req, res) => {
      const { q, offset } = query.parse(req.query);
      res.json({ items: await repo.listReleases({ query: q, offset }) });
    })
  );
  router.get(
    "/api/marketplace/mine",
    requireUser,
    wrap(async (req, res) => {
      const { offset } = query.parse(req.query);
      res.set("Cache-Control", "no-store").json({
        items: await repo.listReleases({
          ownerId: res.locals.user.id,
          offset,
        }),
      });
    })
  );
  router.get(
    "/api/marketplace/review",
    requireAdmin,
    wrap(async (req, res) => {
      const { offset } = query.parse(req.query);
      res
        .set("Cache-Control", "no-store")
        .json({ items: await repo.listReleases({ review: true, offset }) });
    })
  );
  router.post(
    "/api/marketplace/publish",
    requireUser,
    upload,
    wrap(async (req, res) => {
      if (!req.file)
        throw new RegistryError(400, "Attach one WASM file as 'wasm'");
      let manifest: unknown;
      try {
        manifest = JSON.parse(req.body.manifest);
      } catch {
        throw new RegistryError(400, "Invalid manifest JSON");
      }
      const pkg = await validatePackage(manifest, req.file.buffer);
      // Store first; a failed DB commit can leave an unreferenced hash, never a downloadable release.
      const bytes = req.file.buffer;
      const release = await repo.submitRelease(
        res.locals.user as User,
        pkg,
        () => storage().put(pkg.sha256, bytes)
      );
      res.status(201).json({
        ...release,
        name: pkg.manifest.name,
        version: pkg.manifest.version,
        sha256: pkg.sha256,
      });
    })
  );
  router.post(
    "/api/marketplace/review/:id",
    requireAdmin,
    wrap(async (req, res) => {
      const id = z.coerce.number().int().positive().parse(req.params.id);
      const input = registryReviewSchema.parse(req.body);
      await repo.reviewRelease(res.locals.user, id, input.action, input.reason);
      res.json({ success: true });
    })
  );
  // Review downloads are authenticated, including rejected and pending packages.
  router.get(
    "/api/marketplace/review/:name/:version/package",
    requireAdmin,
    wrap(async (req, res) => {
      const release = await repo.getRelease(
        skillName.parse(req.params.name),
        skillVersion.parse(req.params.version),
        res.locals.user
      );
      const bytes = await verifiedPackage(
        storage(),
        release.sha256,
        release.size
      );
      res
        .set({
          "Content-Type": "application/wasm",
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${release.name}-${release.version}.wasm"`,
        })
        .send(bytes);
    })
  );
  router.get(
    "/api/marketplace/skills/:name/:version/package",
    wrap(async (req, res) => {
      const release = await repo.getRelease(
        skillName.parse(req.params.name),
        skillVersion.parse(req.params.version)
      );
      const bytes = await verifiedPackage(
        storage(),
        release.sha256,
        release.size
      );
      // Recheck approval on every request, so revocation also disables old URLs.
      res
        .set({
          "Content-Type": "application/wasm",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": `attachment; filename="${release.name}-${release.version}.wasm"`,
        })
        .send(bytes);
    })
  );
  router.get(
    "/api/marketplace/skills/:name/:version/manifest",
    wrap(async (req, res) => {
      const release = await repo.getRelease(
        skillName.parse(req.params.name),
        skillVersion.parse(req.params.version)
      );
      res.set("Cache-Control", "no-store").json(release.manifest);
    })
  );
  router.get(
    "/api/marketplace/skills/:name/:version?",
    wrap(async (req, res) => {
      const release = await repo.getRelease(
        skillName.parse(req.params.name),
        req.params.version ? skillVersion.parse(req.params.version) : undefined
      );
      res
        .set("Cache-Control", "no-store")
        .json(registryVersionSchema.parse(release));
    })
  );
  router.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof RegistryError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (error instanceof z.ZodError || error instanceof multer.MulterError) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error(
        "[Marketplace] Request failed",
        error instanceof Error ? error.name : "Unknown error"
      );
      res.status(503).json({ error: "Marketplace is temporarily unavailable" });
    }
  );
  return router;
}
export const marketplaceRouter = createMarketplaceRouter();
