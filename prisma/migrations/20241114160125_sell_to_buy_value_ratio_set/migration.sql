/*
  Warnings:

  - Made the column `sellToBuyValueRatio` on table `MarketMakingCycle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` MODIFY `sellToBuyValueRatio` DOUBLE NOT NULL;
