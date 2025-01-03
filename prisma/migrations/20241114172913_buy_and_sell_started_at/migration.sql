-- AlterTable
ALTER TABLE `MarketMakingJob` ADD COLUMN `buyStartedAt` DATETIME(3) NULL,
    ADD COLUMN `sellStartedAt` DATETIME(3) NULL;
