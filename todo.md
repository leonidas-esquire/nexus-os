# Project TODO

## Upgrade Conflict Resolution
- [x] Resolve Home.tsx conflict (keep existing landing page)
- [x] Run pnpm db:push for initial schema sync

## Blog System — Database
- [x] Add blog_posts table to drizzle schema
- [x] Add blog_tags table to drizzle schema
- [x] Add blog_post_tags junction table
- [x] Add blog_authors table
- [x] Add blog_images table (media library)
- [x] Add blog_related_posts table
- [x] Add blog_post_views table
- [x] Push database migrations

## Blog System — Server API (tRPC + Express)
- [x] Blog post CRUD procedures (create, read, update, delete, list)
- [x] Blog tag CRUD procedures
- [x] Blog author CRUD procedures
- [x] Blog image upload endpoint (base64 file upload via tRPC)
- [x] Media library list/delete procedures
- [x] Blog post views tracking
- [x] Related posts management
- [x] Post status management (draft, published, scheduled, archived)
- [x] RSS feed endpoint (/blog/feed.xml)
- [x] Sitemap endpoint (/blog/sitemap.xml)

## Blog System — Admin Pages
- [x] Admin blog dashboard (/admin/blog) with stats, post list, filtering
- [x] Blog post editor with Editor.js WYSIWYG (/admin/blog/new, /admin/blog/edit/:id)
- [x] Post settings sidebar (status, author, tags, cover image, SEO)
- [x] Media library page (/admin/blog/media)
- [x] Tag management UI
- [x] Author management UI

## Blog System — Public Pages
- [x] Blog index page (/blog) with featured post and grid
- [x] Individual post page (/blog/:slug) with SEO meta
- [x] Tag archive page (/blog/tag/:tag)
- [x] Author archive page (/blog/author/:author)
- [x] Share buttons (Twitter, LinkedIn, Copy Link)
- [x] Related posts section on post pages
- [x] Author bio card on post pages

## Blog System — SEO
- [x] Open Graph meta tags per post
- [x] Twitter card meta tags
- [x] JSON-LD structured data
- [x] Canonical URL support
- [x] Reading time and word count calculation

## Blog System — Routes
- [x] Register all blog routes in App.tsx

## Blog System — Tests
- [x] Blog test suite added (server/blog.test.ts) — 24 total tests passing across all suites
- [x] Tests cover: authors CRUD, tags CRUD, posts CRUD, stats, related posts, RSS/sitemap feed data
- [x] Auth guard tests: unauthenticated access rejected for admin procedures

## Seed Initial Content
- [x] Create seed script with author profile (Leonidas Esquire Williamson)
- [x] Create seed tags (AI Agents, Orchestration, Tutorials, Rust, WASM, Edge Computing)
- [x] Create seed published posts with realistic content
- [x] Run seed script to populate database

## Navigation
- [x] Add "Blog" link to landing page navbar

## Editor.js Image Plugin
- [x] Install @editorjs/image package (already in dependencies)
- [x] Add image plugin to Editor.js config with drag-and-drop support
- [x] Wire image upload to S3 via tRPC mutation (uploadByFile + uploadByUrl)
