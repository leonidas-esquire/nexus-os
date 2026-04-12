/**
 * Update cover images for seeded blog posts.
 * Run: node server/update-covers.mjs
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

const covers = [
  {
    slug: 'introducing-nexus-os',
    coverImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-introducing-YJNguMoWHLq5h8NedzmZgv.webp',
    coverImageAlt: 'Nexus OS architecture visualization with connected AI agent nodes',
    ogImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-introducing-JwVnSukYrvLx9v5Y5vtNTt.png',
  },
  {
    slug: 'building-your-first-agent-with-nexus-os',
    coverImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-first-agent-b6dis7b53koDsd7tHiJmk7.webp',
    coverImageAlt: 'Terminal initializing an AI agent with WASM modules and Rust integration',
    ogImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-first-agent-GuZeJ4DJAyHoKNTgL8viAF.png',
  },
  {
    slug: 'token-cost-optimization-how-nexus-os-saves-90-percent',
    coverImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-token-cost-W34woGroiGcfPJRpWAgXEx.webp',
    coverImageAlt: 'AI model routing and cost reduction visualization with skill, WASM, and LLM layers',
    ogImage: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-blog-cover-token-cost-2KMZV9JuBxC8DGTvWSt7h6.png',
  },
];

async function main() {
  for (const c of covers) {
    await db.execute(sql`
      UPDATE blog_posts
      SET coverImage = ${c.coverImage},
          coverImageAlt = ${c.coverImageAlt},
          ogImage = ${c.ogImage}
      WHERE slug = ${c.slug}
    `);
    console.log(`✓ Updated cover for: ${c.slug}`);
  }
  console.log('\nDone! All cover images updated.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
