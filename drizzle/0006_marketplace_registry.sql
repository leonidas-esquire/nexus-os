CREATE TABLE `marketplace_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`versionId` int NOT NULL,
	`actorId` int NOT NULL,
	`action` enum('submitted','approved','rejected','revoked') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_skills` (
	`name` varchar(64) NOT NULL,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_skills_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skillName` varchar(64) NOT NULL,
	`version` varchar(32) NOT NULL,
	`manifest` json NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`size` int NOT NULL,
	`status` enum('pending','approved','rejected','revoked') NOT NULL DEFAULT 'pending',
	`reviewReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketplace_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_release_unique` UNIQUE(`skillName`,`version`)
);
--> statement-breakpoint
ALTER TABLE `marketplace_reviews` ADD CONSTRAINT `marketplace_reviews_versionId_marketplace_versions_id_fk` FOREIGN KEY (`versionId`) REFERENCES `marketplace_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_reviews` ADD CONSTRAINT `marketplace_reviews_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_skills` ADD CONSTRAINT `marketplace_skills_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_versions` ADD CONSTRAINT `marketplace_versions_skillName_marketplace_skills_name_fk` FOREIGN KEY (`skillName`) REFERENCES `marketplace_skills`(`name`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `marketplace_status` ON `marketplace_versions` (`status`);