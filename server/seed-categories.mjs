import { createRequire } from "module";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const conn = await mysql.createConnection(DATABASE_URL);

const categories = [
  { name: "Engineering", slug: "engineering", description: "Technical deep-dives and engineering practices", color: "#6366f1", icon: "code", position: 0 },
  { name: "Product", slug: "product", description: "Product updates, roadmap, and announcements", color: "#06b6d4", icon: "package", position: 1 },
  { name: "Tutorials", slug: "tutorials", description: "Step-by-step guides and how-tos", color: "#10b981", icon: "book-open", position: 2 },
  { name: "Research", slug: "research", description: "AI research papers and analysis", color: "#f59e0b", icon: "microscope", position: 3 },
  { name: "Community", slug: "community", description: "Community stories, events, and contributions", color: "#ec4899", icon: "users", position: 4 },
  { name: "Case Studies", slug: "case-studies", description: "Real-world implementations and success stories", color: "#8b5cf6", icon: "trophy", position: 5 },
  { name: "Opinion", slug: "opinion", description: "Thought leadership and industry perspectives", color: "#ef4444", icon: "message-circle", position: 6 },
];

for (const cat of categories) {
  const id = randomUUID();
  await conn.execute(
    `INSERT INTO blog_categories (id, name, slug, description, color, icon, position, postCount, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [id, cat.name, cat.slug, cat.description, cat.color, cat.icon, cat.position]
  );
  console.log(`  ✓ ${cat.name}`);
}

console.log(`\nSeeded ${categories.length} categories`);
await conn.end();
process.exit(0);
