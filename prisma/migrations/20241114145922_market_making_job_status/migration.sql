/*
  Warnings:

  - Added the required column `sellWalletId` to the `MarketMakingJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MarketMakingJob` ADD COLUMN `sellWalletId` VARCHAR(191) NOT NULL;
