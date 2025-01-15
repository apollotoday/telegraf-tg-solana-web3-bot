/*
  Warnings:

  - Made the column `maxSolSpentForCycle` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxSolEarnedForCycle` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `durationBetweenBuyAndSellInSeconds` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `durationBetweenJobsInSeconds` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `buyMaxAmount` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `buyMinAmount` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` MODIFY `maxSolSpentForCycle` DOUBLE NOT NULL,
    MODIFY `maxSolEarnedForCycle` DOUBLE NOT NULL,
    MODIFY `durationBetweenBuyAndSellInSeconds` INTEGER NOT NULL,
    MODIFY `durationBetweenJobsInSeconds` INTEGER NOT NULL,
    MODIFY `buyMaxAmount` DOUBLE NOT NULL,
    MODIFY `buyMinAmount` DOUBLE NOT NULL;
