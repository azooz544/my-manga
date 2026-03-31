CREATE TABLE `chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mangaId` int NOT NULL,
	`chapterNumber` varchar(50) NOT NULL,
	`title` varchar(255),
	`pageCount` int DEFAULT 0,
	`externalId` varchar(255),
	`source` varchar(50),
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chapters_id` PRIMARY KEY(`id`),
	CONSTRAINT `chapters_externalId_unique` UNIQUE(`externalId`)
);
