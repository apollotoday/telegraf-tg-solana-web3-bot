-- CreateTable
CREATE TABLE `OnChainTransaction` (
    `transactionSignature` VARCHAR(191) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`transactionSignature`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
