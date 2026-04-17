CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`machineId` int,
	`imageUrl` text NOT NULL,
	`imageFileName` varchar(255),
	`identifiedMachineType` varchar(255),
	`identifiedBrand` varchar(255),
	`identifiedModel` varchar(255),
	`identifiedYear` int,
	`confidenceScore` int,
	`anomalies` json,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`minEmission` decimal(10,4) NOT NULL,
	`avgEmission` decimal(10,4) NOT NULL,
	`maxEmission` decimal(10,4) NOT NULL,
	`annualProjection` decimal(15,2) NOT NULL,
	`year1Projection` decimal(15,2),
	`year3Projection` decimal(15,2),
	`year5Projection` decimal(15,2),
	`monthlyProjection` json,
	`formulaUsed` varchar(100),
	`calculationInputs` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machine_data_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchKey` varchar(255) NOT NULL,
	`powerConsumption` decimal(10,2),
	`energySource` varchar(100),
	`efficiency` decimal(5,2),
	`sourceUrls` json,
	`rawData` json,
	`dataQuality` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`usageCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `machine_data_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`machineType` varchar(255) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`model` varchar(255) NOT NULL,
	`yearOfManufacture` int,
	`powerConsumption` decimal(10,2),
	`energySource` varchar(100),
	`efficiency` decimal(5,2),
	`dataSource` varchar(255),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`analysisCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `machines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('sensor','actuator','filter','maintenance','replacement','optimization') NOT NULL,
	`estimatedCO2ReductionPercent` int,
	`estimatedCO2ReductionKg` decimal(10,2),
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`timeline` varchar(100),
	`estimatedCost` varchar(100),
	`requiredComponents` json,
	`implementationSteps` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalAnalyses` int NOT NULL DEFAULT 0,
	`totalMachines` int NOT NULL DEFAULT 0,
	`totalEmissionKgCO2` decimal(15,2) NOT NULL DEFAULT 0,
	`potentialReductionKgCO2` decimal(15,2) NOT NULL DEFAULT 0,
	`netZeroProgress` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_metrics_id` PRIMARY KEY(`id`)
);
