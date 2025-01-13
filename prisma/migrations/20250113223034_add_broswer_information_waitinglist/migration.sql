/*
  Warnings:

  - Added the required column `ip` to the `WaitingList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `WaitingList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `WaitingList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeZone` to the `WaitingList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `WaitingList` ADD COLUMN `ip` VARCHAR(191) NOT NULL,
    ADD COLUMN `language` VARCHAR(191) NOT NULL,
    ADD COLUMN `location` VARCHAR(191) NOT NULL,
    ADD COLUMN `timeZone` VARCHAR(191) NOT NULL;
