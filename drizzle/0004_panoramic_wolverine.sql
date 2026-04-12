CREATE TABLE `blog_posts_v2` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(256) NOT NULL,
	`title` varchar(512) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`author` varchar(256) NOT NULL DEFAULT 'Leonidas Esquire Williamson',
	`category` enum('explainer','tutorial','opinion','case-study','announcement','release') NOT NULL DEFAULT 'explainer',
	`tags` text,
	`readingTimeMinutes` int NOT NULL DEFAULT 5,
	`featuredImageUrl` varchar(2048),
	`featuredImageAlt` varchar(512),
	`ogImageOverride` varchar(2048),
	`featured` boolean NOT NULL DEFAULT false,
	`published` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`scheduledPublishAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_v2_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_v2_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_preview_drafts` (
	`token` varchar(36) NOT NULL,
	`data` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_preview_drafts_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
DROP TABLE `blog_authors`;--> statement-breakpoint
DROP TABLE `blog_categories`;--> statement-breakpoint
DROP TABLE `blog_images`;--> statement-breakpoint
DROP TABLE `blog_post_tags`;--> statement-breakpoint
DROP TABLE `blog_post_views`;--> statement-breakpoint
DROP TABLE `blog_posts`;--> statement-breakpoint
DROP TABLE `blog_related_posts`;--> statement-breakpoint
DROP TABLE `blog_tags`;