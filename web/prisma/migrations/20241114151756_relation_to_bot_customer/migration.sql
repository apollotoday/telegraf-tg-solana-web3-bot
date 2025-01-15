/*
  Warnings:

  - Added the required column `bookedServiceId` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `botCustomerId` to the `MarketMakingCycle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `MarketMakingCycle` ADD COLUMN `bookedServiceId` VARCHAR(191) NOT NULL,
    ADD COLUMN `botCustomerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
