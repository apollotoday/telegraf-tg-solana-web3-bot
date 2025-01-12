/*
  Warnings:

  - You are about to drop the column `raydiumPoolId` on the `BookedService` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `BookedService` DROP COLUMN `raydiumPoolId`,
    ADD COLUMN `poolIdForService` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `LiquidityPoolInfo` ADD COLUMN `poolSource` VARCHAR(191) NOT NULL DEFAULT 'Raydium';
