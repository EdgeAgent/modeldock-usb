CREATE TABLE `deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableKey` varchar(40) NOT NULL,
	`runId` int,
	`workflowId` int,
	`agentId` int,
	`title` varchar(200) NOT NULL,
	`kind` varchar(60) NOT NULL,
	`status` enum('draft','review','approved','delivered','archived') NOT NULL DEFAULT 'draft',
	`summary` text NOT NULL,
	`outputUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliverables_deliverableKey_unique` UNIQUE(`deliverableKey`)
);
--> statement-breakpoint
CREATE TABLE `workflowSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`stepKey` varchar(40) NOT NULL,
	`position` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`stepType` enum('intake','agent','tool','approval','deliverable') NOT NULL,
	`agentId` int,
	`config` json,
	`requiresApproval` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowKey` varchar(40) NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`status` enum('draft','published','paused') NOT NULL DEFAULT 'draft',
	`triggerType` varchar(40) NOT NULL DEFAULT 'manual',
	`createdBy` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflows_workflowKey_unique` UNIQUE(`workflowKey`)
);
