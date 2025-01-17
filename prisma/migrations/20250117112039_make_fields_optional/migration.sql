-- AlterTable
ALTER TABLE `SplToken` ADD COLUMN `buyCount1h` INTEGER NULL,
    ADD COLUMN `buyCount24h` INTEGER NULL,
    ADD COLUMN `buyCount2h` INTEGER NULL,
    ADD COLUMN `buyCount30m` INTEGER NULL,
    ADD COLUMN `buyCount4h` INTEGER NULL,
    ADD COLUMN `buyCount8h` INTEGER NULL,
    ADD COLUMN `sellCount1h` INTEGER NULL,
    ADD COLUMN `sellCount24h` INTEGER NULL,
    ADD COLUMN `sellCount2h` INTEGER NULL,
    ADD COLUMN `sellCount30m` INTEGER NULL,
    ADD COLUMN `sellCount4h` INTEGER NULL,
    ADD COLUMN `sellCount8h` INTEGER NULL,
    ADD COLUMN `tradeCount1h` INTEGER NULL,
    ADD COLUMN `tradeCount24h` INTEGER NULL,
    ADD COLUMN `tradeCount2h` INTEGER NULL,
    ADD COLUMN `tradeCount30m` INTEGER NULL,
    ADD COLUMN `tradeCount4h` INTEGER NULL,
    ADD COLUMN `tradeCount8h` INTEGER NULL,
    ADD COLUMN `v30mUSD` DOUBLE NULL,
    ADD COLUMN `vBuy30mUSD` DOUBLE NULL,
    ADD COLUMN `vSell30mUSD` DOUBLE NULL;

-- AlterTable
ALTER TABLE `WaitingList` MODIFY `location` VARCHAR(191) NULL,
    MODIFY `timeZone` VARCHAR(191) NULL,
    MODIFY `languages` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TokenPriceInformationOCHLV` (
    `tokenMint` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `unixTimestamp` INTEGER NOT NULL,
    `openingPrice` DOUBLE NULL,
    `closingPrice` DOUBLE NULL,
    `highPrice` DOUBLE NULL,
    `lowPrice` DOUBLE NULL,
    `volume` DOUBLE NULL,
    `timeframe` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`tokenMint`, `unixTimestamp`, `timeframe`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
