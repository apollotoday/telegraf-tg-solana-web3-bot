/*
  Warnings:

  - Made the column `usedSplTokenMint` on table `BookedService` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `BookedService` MODIFY `usedSplTokenMint` VARCHAR(191) NOT NULL;
