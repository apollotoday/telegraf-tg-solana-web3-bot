/*
  Warnings:

  - You are about to drop the column `buyWalletId` on the `MarketMakingJob` table. All the data in the column will be lost.
  - You are about to drop the column `sellWalletId` on the `MarketMakingJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `MarketMakingJob` DROP COLUMN `buyWalletId`,
    DROP COLUMN `sellWalletId`,
    ADD COLUMN `buyWalletPubkey` VARCHAR(191) NULL,
    ADD COLUMN `sellWalletPubkey` VARCHAR(191) NULL;
