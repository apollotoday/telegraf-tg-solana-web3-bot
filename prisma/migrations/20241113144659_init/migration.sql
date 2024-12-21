-- CreateTable
CREATE TABLE `CompanyWallet` (
    `pubkey` VARCHAR(191) NOT NULL,
    `encryptedPrivKey` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'FEE_PAYER_FUND', 'SERVICE_FUNDING', 'VOLUME', 'FEES', 'MARKET_MAKING') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`pubkey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SplToken` (
    `tokenMint` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `decimals` INTEGER NOT NULL DEFAULT 9,
    `isSPL` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastUsdcPrice` DOUBLE NULL,

    PRIMARY KEY (`tokenMint`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookedService` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('VOLUME', 'RANKING', 'MARKET_MAKING') NOT NULL,
    `usedSplTokenMint` VARCHAR(191) NULL,
    `solAmountForService` DOUBLE NULL,
    `botCustomerId` VARCHAR(191) NOT NULL,
    `mainWalletId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `BookedService_mainWalletId_key`(`mainWalletId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BotCustomerWallet` (
    `pubkey` VARCHAR(191) NOT NULL,
    `encryptedPrivKey` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'FEE_PAYER_FUND', 'SERVICE_FUNDING', 'VOLUME', 'FEES', 'MARKET_MAKING') NOT NULL,
    `botCustomerId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `latestSolBalance` DOUBLE NULL,
    `latestTokenBalance` DOUBLE NULL,

    PRIMARY KEY (`pubkey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BotCustomer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telegramUsername` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketMakingCycle` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PRE_PUSH', 'PUSH', 'POST_PUSH', 'MAINTAIN', 'TAKE_PROFIT') NOT NULL,
    `solSpentForCycle` DOUBLE NULL,
    `maxSolSpentForCycle` DOUBLE NULL,
    `solEarnedForCycle` DOUBLE NULL,
    `maxSolEarnedForCycle` DOUBLE NULL,
    `buyMinRange` DOUBLE NULL,
    `buyMaxRange` DOUBLE NULL,
    `sellToBuyValueRatio` DOUBLE NULL,
    `durationBetweenBuyAndSellInSeconds` INTEGER NULL,
    `durationBetweenJobsInSeconds` INTEGER NULL,
    `plannedTotalDurationInMinutes` INTEGER NULL,
    `startTimestamp` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTimestamp` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketMakingJob` (
    `id` VARCHAR(191) NOT NULL,
    `cycleId` VARCHAR(191) NOT NULL,
    `buyWalletId` VARCHAR(191) NOT NULL,
    `earliestExecutionTimestampForBuy` DATETIME(3) NULL,
    `latestExecutionTimestampForBuy` DATETIME(3) NULL,
    `executedAtForBuy` DATETIME(3) NULL,
    `tokenPriceAtBuy` DOUBLE NULL,
    `solSpent` DOUBLE NULL,
    `tokenBought` DOUBLE NULL,
    `earliestExecutionTimestampForSell` DATETIME(3) NULL,
    `latestExecutionTimestampForSell` DATETIME(3) NULL,
    `executedAtForSell` DATETIME(3) NULL,
    `tokenPriceAtSell` DOUBLE NULL,
    `solEarned` DOUBLE NULL,
    `tokenSold` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
