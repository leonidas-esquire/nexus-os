import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const blogUploadRouter = Router();

blogUploadRouter.post(
  "/api/blog/upload-image",
  upload.single("image"),
  async (req, res) => {
    try {
      // Authenticate admin
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Build SEO-friendly S3 key: retain original filename + random suffix
      const ext = file.originalname.split(".").pop() || "jpg";
      const baseName = file.originalname
        .replace(/\.[^/.]+$/, "") // strip extension
        .replace(/[^a-zA-Z0-9-_]/g, "-") // sanitize
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      const suffix = Math.random().toString(36).slice(2, 8);
      const key = `blog-images/${baseName}-${suffix}.${ext}`;

      const { url } = await storagePut(key, file.buffer, file.mimetype);

      res.json({ url, key });
    } catch (err: any) {
      console.error("[Blog Upload] Error:", err);
      if (err.message?.includes("Unsupported file type")) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export { blogUploadRouter };
