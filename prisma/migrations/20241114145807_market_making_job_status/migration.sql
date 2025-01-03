-- AlterTable
ALTER TABLE `MarketMakingJob` ADD COLUMN `buyStatus` ENUM('OPEN', 'FINISHED', 'FAILED') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `buyTransactionSignature` VARCHAR(191) NULL,
    ADD COLUMN `sellStatus` ENUM('OPEN', 'FINISHED', 'FAILED') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `sellTransactionSignature` VARCHAR(191) NULL;
