/*
  Warnings:

  - You are about to drop the column `language` on the `WaitingList` table. All the data in the column will be lost.
  - Added the required column `languages` to the `WaitingList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `WaitingList` DROP COLUMN `language`,
    ADD COLUMN `languages` VARCHAR(191) NOT NULL;
