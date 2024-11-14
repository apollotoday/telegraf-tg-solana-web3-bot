/*
  Warnings:

  - You are about to drop the column `buyMaxRange` on the `MarketMakingCycle` table. All the data in the column will be lost.
  - You are about to drop the column `buyMinRange` on the `MarketMakingCycle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` DROP COLUMN `buyMaxRange`,
    DROP COLUMN `buyMinRange`,
    ADD COLUMN `buyMaxAmount` DOUBLE NULL,
    ADD COLUMN `buyMinAmount` DOUBLE NULL;
