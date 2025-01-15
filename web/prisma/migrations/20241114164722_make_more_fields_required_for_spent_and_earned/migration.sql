/*
  Warnings:

  - Made the column `solSpentForCycle` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `solEarnedForCycle` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` MODIFY `solSpentForCycle` DOUBLE NOT NULL,
    MODIFY `solEarnedForCycle` DOUBLE NOT NULL;
