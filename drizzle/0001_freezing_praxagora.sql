CREATE TABLE `manga` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`coverUrl` varchar(512),
	`rating` int DEFAULT 0,
	`year` int,
	`genres` text,
	`type` enum('manga','manhwa','manhua') DEFAULT 'manga',
	`anilistId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manga_id` PRIMARY KEY(`id`),
	CONSTRAINT `manga_title_unique` UNIQUE(`title`),
	CONSTRAINT `manga_anilistId_unique` UNIQUE(`anilistId`)
);
