import { Router } from "express";
import * as blogDb from "./blogDb";

const feedRouter = Router();

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Atom 1.0 Feed (/blog/feed.xml) ────────────────────────────────
feedRouter.get("/blog/feed.xml", async (_req, res) => {
  try {
    const posts = await blogDb.getBlogPosts({ limit: 20 });

    const entries = posts
      .map((post) => {
        const updated = post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : new Date(post.publishedAt).toISOString();
        const published = new Date(post.publishedAt).toISOString();

        return `  <entry>
    <id>https://aiagents.nexus/blog/${escapeXml(post.slug)}</id>
    <title>${escapeXml(post.title)}</title>
    <link rel="alternate" href="https://aiagents.nexus/blog/${escapeXml(post.slug)}" />
    <updated>${updated}</updated>
    <published>${published}</published>
    <author><name>${escapeXml(post.author)}</name></author>
    <summary>${escapeXml(post.excerpt)}</summary>
    <content type="html"><![CDATA[${post.content}]]></content>
  </entry>`;
      })
      .join("\n");

    const feedUpdated =
      posts.length > 0
        ? new Date(posts[0].updatedAt ?? posts[0].publishedAt).toISOString()
        : new Date().toISOString();

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>https://aiagents.nexus/blog</id>
  <title>Nexus OS Blog</title>
  <subtitle>News, tutorials, and insights about AI agent orchestration</subtitle>
  <link rel="self" href="https://aiagents.nexus/blog/feed.xml" type="application/atom+xml" />
  <link rel="alternate" href="https://aiagents.nexus/blog" />
  <updated>${feedUpdated}</updated>
  <author><name>Nexus OS</name></author>
${entries}
</feed>`;

    res.setHeader("Content-Type", "application/atom+xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(feed);
  } catch (err) {
    console.error("[Atom Feed] Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ─── Sitemap (/blog/sitemap.xml) ────────────────────────────────
feedRouter.get("/blog/sitemap.xml", async (_req, res) => {
  try {
    const posts = await blogDb.getBlogPosts({ limit: 9999 });

    const postUrls = posts
      .map(
        (post) => `  <url>
    <loc>https://aiagents.nexus/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aiagents.nexus/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://aiagents.nexus/blog/feed.xml</loc>
    <changefreq>daily</changefreq>
    <priority>0.3</priority>
  </url>
${postUrls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(sitemap);
  } catch (err) {
    console.error("[Sitemap] Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

export { feedRouter };
