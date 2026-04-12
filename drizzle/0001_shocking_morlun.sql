CREATE TABLE `blog_authors` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`email` varchar(320),
	`bio` text,
	`avatar` text,
	`twitter` varchar(100),
	`github` varchar(100),
	`linkedin` text,
	`website` text,
	`authorRole` enum('contributor','editor','admin') NOT NULL DEFAULT 'contributor',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_authors_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_authors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_images` (
	`id` varchar(36) NOT NULL,
	`filename` varchar(500) NOT NULL,
	`originalName` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`width` int,
	`height` int,
	`sizeBytes` int,
	`mimeType` varchar(100),
	`altText` text,
	`caption` text,
	`uploadedBy` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_post_tags` (
	`postId` varchar(36) NOT NULL,
	`tagId` varchar(36) NOT NULL,
	CONSTRAINT `blog_post_tags_postId_tagId_pk` PRIMARY KEY(`postId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `blog_post_views` (
	`id` varchar(36) NOT NULL,
	`postId` varchar(36) NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`referrer` text,
	`userAgent` text,
	`country` varchar(10),
	CONSTRAINT `blog_post_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`title` varchar(500) NOT NULL,
	`subtitle` text,
	`excerpt` text,
	`content` text NOT NULL,
	`contentJson` text,
	`coverImage` text,
	`coverImageAlt` text,
	`ogImage` text,
	`ogTitle` text,
	`ogDescription` text,
	`authorId` varchar(36) NOT NULL,
	`status` enum('draft','published','scheduled','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`scheduledFor` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`readingTime` int,
	`wordCount` int,
	`canonicalUrl` text,
	`metaRobots` varchar(100) NOT NULL DEFAULT 'index,follow',
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_related_posts` (
	`postId` varchar(36) NOT NULL,
	`relatedPostId` varchar(36) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `blog_related_posts_postId_relatedPostId_pk` PRIMARY KEY(`postId`,`relatedPostId`)
);
--> statement-breakpoint
CREATE TABLE `blog_tags` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(20) NOT NULL DEFAULT '#00ff88',
	`postCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `blog_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `blog_tags_slug_unique` UNIQUE(`slug`)
);
