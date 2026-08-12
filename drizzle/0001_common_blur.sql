CREATE TABLE `agentRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runKey` varchar(32) NOT NULL,
	`agentId` int NOT NULL,
	`task` text NOT NULL,
	`priority` enum('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
	`tierLevel` varchar(24) NOT NULL DEFAULT 'Tier 1',
	`status` enum('running','waiting_approval','completed','paused','failed') NOT NULL DEFAULT 'running',
	`currentStep` varchar(180) NOT NULL DEFAULT 'Initializing workflow',
	`elapsedSeconds` int NOT NULL DEFAULT 0,
	`costCents` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentRuns_id` PRIMARY KEY(`id`),
	CONSTRAINT `agentRuns_runKey_unique` UNIQUE(`runKey`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`department` varchar(80) NOT NULL,
	`role` varchar(140) NOT NULL,
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`model` varchar(120) NOT NULL,
	`allowedTools` json NOT NULL,
	`accent` varchar(32) NOT NULL DEFAULT 'cyan',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalKey` varchar(32) NOT NULL,
	`runId` int NOT NULL,
	`agentId` int NOT NULL,
	`proposedAction` text NOT NULL,
	`toolName` varchar(180) NOT NULL,
	`parameters` json NOT NULL,
	`evidence` text NOT NULL,
	`riskTier` varchar(24) NOT NULL,
	`deadline` timestamp NOT NULL,
	`status` enum('pending','approved','denied','resubmitted') NOT NULL DEFAULT 'pending',
	`denialReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `approvals_approvalKey_unique` UNIQUE(`approvalKey`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`actorType` enum('human','agent','system') NOT NULL,
	`actorName` varchar(160) NOT NULL,
	`details` text NOT NULL,
	`referenceKey` varchar(80),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`approvalTier` varchar(24) NOT NULL,
	`spendLimitCents` int NOT NULL DEFAULT 0,
	`dataClassification` varchar(80) NOT NULL,
	`lastReviewDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`globalKillSwitch` int NOT NULL DEFAULT 0,
	`updatedBy` varchar(160) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceState_id` PRIMARY KEY(`id`)
);
