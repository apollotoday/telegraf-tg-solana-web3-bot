/*
  Warnings:

  - You are about to drop the column `durationBetweenBuyAndSellInSeconds` on the `MarketMakingCycle` table. All the data in the column will be lost.
  - You are about to drop the column `durationBetweenJobsInSeconds` on the `MarketMakingCycle` table. All the data in the column will be lost.
  - Added the required column `maxDurationBetweenBuyAndSellInSeconds` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDurationBetweenJobsInSeconds` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minDurationBetweenBuyAndSellInSeconds` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minDurationBetweenJobsInSeconds` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` DROP COLUMN `durationBetweenBuyAndSellInSeconds`,
    DROP COLUMN `durationBetweenJobsInSeconds`,
    ADD COLUMN `maxDurationBetweenBuyAndSellInSeconds` INTEGER NOT NULL,
    ADD COLUMN `maxDurationBetweenJobsInSeconds` INTEGER NOT NULL,
    ADD COLUMN `minDurationBetweenBuyAndSellInSeconds` INTEGER NOT NULL,
    ADD COLUMN `minDurationBetweenJobsInSeconds` INTEGER NOT NULL;
