import { Router } from "express";
import * as blog from "./blogDb";
import * as showcase from "./showcaseDb";
export const communityDocuments = Router();
communityDocuments.get(
  ["/docs-markdown/blog/:slug.md", "/api/blog/:slug.md"],
  async (req, res) => {
    try {
      const post = await blog.getBlogPostBySlug(req.params.slug);
      if (!post) {
        res.status(404).json({ error: "Published post not found" });
        return;
      }
      res
        .set("Cache-Control", "no-store")
        .type("text/markdown")
        .send(
          `---\ntitle: ${JSON.stringify(post.title)}\nresource: https://www.aiagents.nexus/blog/${post.slug}\nmodified: ${post.updatedAt.toISOString()}\n---\n\n# ${post.title}\n\nBy ${post.author}\n\n${post.excerpt}\n\n${post.content}\n`
        );
    } catch {
      res.status(503).json({ error: "Blog document unavailable" });
    }
  }
);
communityDocuments.get("/docs-markdown/showcase/:slug.md", async (req, res) => {
  try {
    const p = await showcase.getShowcaseProjectBySlug(req.params.slug);
    if (!p || !["approved", "featured"].includes(p.status)) {
      res.status(404).json({ error: "Approved project not found" });
      return;
    }
    res
      .set("Cache-Control", "no-store")
      .type("text/markdown")
      .send(
        `---\ntitle: ${JSON.stringify(p.title)}\nresource: https://www.aiagents.nexus/showcase/${p.slug}\nmodified: ${p.updatedAt.toISOString()}\n---\n\n# ${p.title}\n\n${p.tagline}\n\nBy ${p.authorName}\n\n${p.description}\n\nRepository: ${p.repoUrl || "Not supplied"}\nDemo: ${p.demoUrl || "Not supplied"}\nWebsite: ${p.websiteUrl || "Not supplied"}\nFeatures: ${JSON.stringify(p.featuresUsed)}\n\nPublisher supplied description; publication approval is not independent certification.\n`
      );
  } catch {
    res.status(503).json({ error: "Showcase document unavailable" });
  }
});
