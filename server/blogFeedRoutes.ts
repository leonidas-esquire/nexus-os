import { Router } from "express";
import * as blogDb from "./blogDb";

const feedRouter = Router();

// ─── RSS Feed (/blog/feed.xml) ──────────────────────────────────
feedRouter.get("/blog/feed.xml", async (_req, res) => {
  try {
    const { posts } = await blogDb.listPosts({ status: "published", limit: 50 });
    const enriched = await blogDb.enrichPostsWithRelations(posts);

    const items = enriched.map(post => {
      const tags = (post.tags ?? []).map(t => `      <category>${escapeXml(t.name)}</category>`).join("\n");
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>https://aiagents.nexus/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">https://aiagents.nexus/blog/${escapeXml(post.slug)}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.createdAt).toUTCString()}</pubDate>
      <author>${escapeXml(post.author?.email ?? "")} (${escapeXml(post.author?.name ?? "Unknown")})</author>
${tags}
      <description><![CDATA[${post.excerpt ?? ""}]]></description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>${post.coverImage ? `\n      <enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg"/>` : ""}
    </item>`;
    });

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nexus OS Blog</title>
    <link>https://aiagents.nexus/blog</link>
    <description>News, tutorials, and insights about AI agent orchestration</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://aiagents.nexus/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(feed);
  } catch (err) {
    console.error("[RSS Feed] Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ─── Sitemap (/blog/sitemap.xml) ────────────────────────────────
feedRouter.get("/blog/sitemap.xml", async (_req, res) => {
  try {
    const { posts } = await blogDb.listPosts({ status: "published", limit: 9999 });
    const tags = await blogDb.listTags();

    const postUrls = posts.map(post => `  <url>
    <loc>https://aiagents.nexus/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

    const tagUrls = tags.map(tag => `  <url>
    <loc>https://aiagents.nexus/blog/tag/${escapeXml(tag.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aiagents.nexus/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${postUrls.join("\n")}
${tagUrls.join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(sitemap);
  } catch (err) {
    console.error("[Sitemap] Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export { feedRouter };
