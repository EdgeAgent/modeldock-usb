ALTER TABLE `agents` ADD `systemInstructions` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `memory` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `enabledSkills` json;--> statement-breakpoint
ALTER TABLE `agents` ADD `enabledConnectors` json;