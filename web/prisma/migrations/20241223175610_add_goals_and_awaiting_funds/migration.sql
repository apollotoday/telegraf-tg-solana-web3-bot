-- AlterTable
ALTER TABLE `BookedService` ADD COLUMN `awaitingFunding` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `marketMakingGoal` ENUM('VOLUME_CREATION', 'OPTIMIZE_PROFITS', 'HEALTHY_MARKET') NULL,
    ADD COLUMN `marketMakingTradingStyle` ENUM('STEADY', 'CONSERVATIVE', 'AGGRESSIVE') NULL;

-- AlterTable
ALTER TABLE `MarketMakingCycle` ADD COLUMN `endTokenPrice` DOUBLE NULL,
    ADD COLUMN `startTokenPrice` DOUBLE NULL;
