-- AlterTable
ALTER TABLE `BookedService` MODIFY `type` ENUM('VOLUME', 'RANKING', 'MARKET_MAKING', 'SNIPER') NOT NULL;

-- AlterTable
ALTER TABLE `BotCustomerWallet` MODIFY `type` ENUM('DEPOSIT', 'FEE_PAYER_FUND', 'SERVICE_FUNDING', 'VOLUME', 'FEES', 'MARKET_MAKING', 'SNIPING') NOT NULL;

-- AlterTable
ALTER TABLE `CompanyWallet` MODIFY `type` ENUM('DEPOSIT', 'FEE_PAYER_FUND', 'SERVICE_FUNDING', 'VOLUME', 'FEES', 'MARKET_MAKING', 'SNIPING') NOT NULL;
