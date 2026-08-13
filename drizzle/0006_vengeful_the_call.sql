CREATE TABLE `executionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorType` enum('human','agent','system') NOT NULL,
	`actorName` varchar(160) NOT NULL,
	`step` varchar(180),
	`message` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `executionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `agentRuns` DROP COLUMN `workflowId`;