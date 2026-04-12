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

## Bug Fixes
- [x] Fix editor showing blank for existing posts that have HTML content but no contentJson
- [x] Added htmlToEditorBlocks() converter as fallback (no seed update needed)

## Editor Enhancements
- [x] Add persistent formatting toolbar at top of editor (bold, italic, headings, lists, code, quote, link, image)
- [x] Increase image upload limit to 100MB
- [x] Add OG image upload option in post settings panel (Media tab)
- [x] Add post tags selector in editor settings panel (General tab with toggle badges)
- [x] Add categories feature with prefilled dropdown + custom category option
- [x] Add categories database table and migration
- [x] Add category CRUD endpoints to blog router
- [x] Add category selector to editor settings panel (General tab with combobox + inline create)
- [x] Professional formatting: highlight, table, divider, warning/callout, raw HTML, checklist blocks
- [x] Update public blog pages to display categories (BlogIndex + BlogPost)
- [x] Seed default categories (7: Engineering, Product, Tutorials, Research, Community, Case Studies, Opinion)

## Formatting & Editor Fixes (Round 2)
- [x] Fix formatting toolbar controls (added onMouseDown preventDefault to preserve selection)
- [x] Add cover images to seeded posts via CDN upload (3 AI-generated images)
- [x] Ensure categories work properly in blog editor (General tab with combobox)
- [x] Add category filter to blog index page alongside tag filter

## Bug Fixes (Round 3)
- [x] Fix H2/H3 heading toolbar buttons (now use convertToHeading() to convert current block type)
- [x] Add alt text option for uploaded images (ImageUploadField now has altText/onAltTextChange props)
- [x] Make category option more discoverable ("Add category" button visible below title + in Settings panel)
- [x] Add ogImageAlt column to blogPosts schema and push migration
- [x] Wire ogImageAlt through blog router (create + update mutations) and editor state
- [x] Add og:image:alt meta tag to public blog post page
- [x] Fix htmlToEditorBlocks to preserve alt text from img tags
- [x] Add tests for ogImageAlt, coverImageAlt, and categoryId on posts (31 tests passing)

## Blog Redesign (Spec v1.0 — Markdown-based)
- [x] Replace blog schema: new blog_posts table (INT PK, slug, title, excerpt, content as Markdown, author string, category ENUM, tags JSON, readingTimeMinutes, featuredImageUrl, featuredImageAlt, ogImageOverride, featured bool, published bool, publishedAt, scheduledPublishAt, createdAt, updatedAt)
- [x] Add blog_preview_drafts table (token PK, data JSON, expiresAt, createdAt)
- [x] Drop old blog tables (blog_authors, blog_tags, blog_post_tags, blog_categories, blog_images, blog_related_posts, blog_post_views)
- [x] Push database migration
- [x] Implement DB helpers: getBlogPosts, getBlogPostBySlug, getAdminBlogPosts, upsertBlogPost, deleteBlogPost, publishScheduledPosts, createBlogPreviewDraft, getBlogPreviewDraft
- [x] Add public tRPC router (blog.list, blog.featured, blog.getBySlug)
- [x] Add admin tRPC router (adminBlog.list, adminBlog.upsert, adminBlog.delete, adminBlog.previewToken, adminBlog.getPreview)
- [x] Create REST image upload endpoint (POST /api/blog/upload-image with multer, admin auth, S3)
- [x] Create Atom 1.0 feed at /blog/feed.xml (RFC 4287 compliant)
- [x] Create sitemap with blog posts at /blog/sitemap.xml
- [x] Add scheduled publishing job (setInterval every 60s calling publishScheduledPosts)
- [x] Create SSR middleware for /blog, /blog/:slug, /blog/preview/:token meta tag injection
- [x] Install react-markdown + remark-gfm
- [x] Build public Blog.tsx listing page (featured hero, category pills, post grid)
- [x] Build public BlogPost.tsx page (Markdown rendering, category badge, tag chips, featured image)
- [x] Build BlogPostPreview.tsx page (token-gated draft preview)
- [x] Build AdminBlog.tsx editor (Markdown textarea + toolbar, live preview, all form fields, drag-drop image upload)
- [x] Update App.tsx routes (remove old blog/admin routes, add new ones)
- [x] Remove old blog UI files (BlogEditor.tsx, BlogDashboard.tsx, MediaLibrary.tsx, TagManager.tsx, AuthorManager.tsx, TagArchive.tsx, AuthorArchive.tsx) and rewrite blogDb.ts, blogRouter.ts, blogFeedRoutes.ts with new spec logic
- [x] Update robots.txt to allow /blog/
- [x] Write Vitest tests covering spec requirements (21 tests across 7 suites — all passing)
- [x] Seed initial blog content (4 posts via seed-blog-v2.mjs script)

## Bug Fixes (Round 4)
- [x] Fix blog feed — moved to /api/blog/feed.xml and /api/blog/sitemap.xml to bypass CDN SPA fallback on production

## Legal Pages
- [x] Create /legal index page with links to Terms and Privacy
- [x] Create /legal/terms page with full Terms of Service content
- [x] Create /legal/privacy page with full Privacy Policy content
- [x] Add TOC sidebar with anchor links for long documents
- [x] Add print-friendly CSS styles
- [x] Mobile responsive design for legal pages
- [x] Add meta tags (noindex, follow) for legal pages
- [x] Add footer links to Terms, Privacy, and Contact across site
- [x] Register routes in App.tsx
- [x] Push to GitHub repo (leonidas-esquire/nexus-os)

## Open-Source Project Files
- [x] Create LICENSE file (Apache 2.0)
- [x] Create README.md (project overview, badges, features, quickstart, CLI reference)
- [x] Create CONTRIBUTING.md (contributing guide, CoC, development setup, PR process)
- [x] Update .gitignore (Rust-focused, exclude secrets and private docs)
- [x] Create SECURITY.md (security vulnerability reporting policy)
- [x] Push all files to GitHub (leonidas-esquire/nexus-os)

## GitHub Community Files
- [x] Create CODE_OF_CONDUCT.md (Contributor Covenant v2.1)
- [x] Update CONTRIBUTING.md to reference CODE_OF_CONDUCT.md instead of inline CoC
- [x] Create .github/ISSUE_TEMPLATE/bug_report.md
- [x] Create .github/ISSUE_TEMPLATE/feature_request.md
- [x] Create .github/ISSUE_TEMPLATE/config.yml (template chooser config)
- [x] Push all files to GitHub (leonidas-esquire/nexus-os)

## Bug Fixes (Round 5)
- [x] Fix GitHub repo default branch showing MIT instead of Apache 2.0 (changed default from master to main)
- [x] README.md license badge and License section already correct on main branch (Apache 2.0)

## GitHub Repo Maintenance
- [x] Delete stale master branch
- [x] Add branch protection rules on main (1 approving review, dismiss stale reviews, linear history, no force pushes)
- [x] Create v0.1.0 GitHub Release with release notes (https://github.com/leonidas-esquire/nexus-os/releases/tag/v0.1.0)

## Showcase Feature
- [x] Create showcase_projects table (id, slug, title, tagline, description, screenshots, links, author info, features_used, category, status, stats, timestamps)
- [x] Create showcase_upvotes table (project_id + user_ip_hash composite PK)
- [x] Push database migration
- [x] Implement showcase DB helpers (list, getBySlug, submit, upvote toggle, admin CRUD)
- [x] Create public tRPC router (showcase.list, showcase.featured, showcase.getBySlug, showcase.upvote, showcase.categories)
- [x] Create submission tRPC router (showcase.submit)
- [x] Create admin tRPC router (adminShowcase.list, adminShowcase.pending, adminShowcase.update, adminShowcase.approve, adminShowcase.feature, adminShowcase.reject, adminShowcase.delete)
- [x] Create REST image upload endpoint (POST /api/showcase/upload-image)
- [x] Build /showcase gallery page (featured hero, category pills, search, sort, responsive grid, pagination)
- [x] Build /showcase/submit form (project details, feature checkboxes, media upload, links, author info, validation)
- [x] Build /showcase/[slug] project detail page (screenshot gallery, markdown description, stats, related projects, upvote)
- [x] Build /admin/showcase admin panel (pending queue, approve/reject/feature, project table, search/filter)
- [x] Update App.tsx routes for all showcase pages
- [x] Add Showcase to main navigation
- [x] Add Showcase link to footer Community section
- [x] Write Vitest tests for showcase feature (21 tests — all passing)
- [x] Seed sample showcase projects for initial content (6 projects: 3 featured, 3 approved)
- [ ] Push to GitHub
