import { Router } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const showcaseUploadRouter = Router();

// Public upload endpoint for showcase submissions (no auth required)
showcaseUploadRouter.post(
  "/api/showcase/upload-image",
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Build S3 key with random suffix to prevent enumeration
      const ext = file.originalname.split(".").pop() || "jpg";
      const baseName = file.originalname
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100);
      const suffix = Math.random().toString(36).slice(2, 10);
      const key = `showcase-images/${baseName}-${suffix}.${ext}`;

      const { url } = await storagePut(key, file.buffer, file.mimetype);

      res.json({ url, key });
    } catch (err: any) {
      console.error("[Showcase Upload] Error:", err);
      if (err.message?.includes("Unsupported file type")) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export { showcaseUploadRouter };
