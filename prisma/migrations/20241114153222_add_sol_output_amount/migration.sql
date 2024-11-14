-- AlterTable
ALTER TABLE `MarketMakingJob` ADD COLUMN `buyExpectedTokenOutputAmount` DOUBLE NULL,
    ADD COLUMN `buyOutputTokenBalance` DOUBLE NULL,
    ADD COLUMN `sellExpectedSolOutputAmount` DOUBLE NULL,
    ADD COLUMN `sellOutputSolBalance` DOUBLE NULL;
