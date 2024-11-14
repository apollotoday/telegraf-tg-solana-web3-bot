"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const botCustomer_1 = require("../src/modules/customer/botCustomer");
const walletService_1 = require("../src/modules/wallet/walletService");
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../src/lib/prisma"));
const walletUtils_1 = require("../src/modules/wallet/walletUtils");
const config_1 = require("../src/config");
const web3_js_1 = require("@solana/web3.js");
const solTransactionUtils_1 = require("../src/modules/solTransaction/solTransactionUtils");
const solSendTransactionUtils_1 = require("../src/modules/solTransaction/solSendTransactionUtils");
const bookedService_1 = require("../src/modules/customer/bookedService");
const birdeye_1 = require("../src/modules/monitor/birdeye");
const jupiter_1 = require("../src/modules/markets/jupiter");
const changeConsoleLogWithTimestamp_1 = require("../src/modules/utils/changeConsoleLogWithTimestamp");
const program = new commander_1.Command();
const drewTokenMint = new web3_js_1.PublicKey('14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT');
(0, changeConsoleLogWithTimestamp_1.overwriteConsoleLog)();
program.command('initDrewMarketMaking').action(() => __awaiter(void 0, void 0, void 0, function* () {
    const drewBotCustomer = yield (0, botCustomer_1.createBotCustomer)({
        name: 'Drew'
    });
    console.log(`created bot customer ${drewBotCustomer.id}: ${drewBotCustomer.name}`);
    const botCustomerWallets = yield (0, walletService_1.createAndStoreBotCustomerWallets)({
        subWalletCount: 16,
        walletType: client_1.EWalletType.MARKET_MAKING,
        customerId: drewBotCustomer.id,
    });
    console.log(`created ${botCustomerWallets.count} wallets for market making`);
    const foundWallets = yield prisma_1.default.botCustomerWallet.findMany({
        where: {
            botCustomerId: drewBotCustomer.id,
            type: client_1.EWalletType.MARKET_MAKING
        }
    });
    console.log(`found ${foundWallets.length} wallets for market making`);
    console.log(foundWallets.map((wallet) => wallet.pubkey));
    const testWallet = foundWallets[0];
    console.log((0, walletUtils_1.decryptWallet)(testWallet.encryptedPrivKey), 'for', testWallet.pubkey);
}));
program.command('initDrewMarketMakingService').action(() => __awaiter(void 0, void 0, void 0, function* () {
    const botCustomer = yield prisma_1.default.botCustomer.findFirst({
        where: {
            name: 'Drew'
        }
    });
    if (!botCustomer) {
        console.error('bot customer not found');
        return;
    }
    yield prisma_1.default.splToken.create({
        data: {
            name: 'DREW',
            symbol: 'DREW',
            tokenMint: drewTokenMint.toBase58(),
            decimals: 9,
            isSPL: true,
        }
    });
    const bookedService = yield (0, bookedService_1.createBookedServiceAndWallet)({
        botCustomerId: botCustomer.id,
        solAmount: 43,
        serviceType: client_1.EServiceType.MARKET_MAKING,
        usedSplTokenMint: drewTokenMint.toBase58(),
    });
    console.log(`created booked service ${bookedService.id} for market making`);
    const cycle = yield prisma_1.default.marketMakingCycle.create({
        data: {
            buyMinAmount: 0.15,
            buyMaxAmount: 0.59,
            minDurationBetweenBuyAndSellInSeconds: 14,
            maxDurationBetweenBuyAndSellInSeconds: 300,
            minDurationBetweenJobsInSeconds: 300,
            maxDurationBetweenJobsInSeconds: 350,
            solSpentForCycle: 0,
            maxSolSpentForCycle: 7,
            maxSolEarnedForCycle: 0,
            solEarnedForCycle: 0,
            sellToBuyValueRatio: 0.51,
            type: client_1.EMarketMakingCycleType.PUSH,
            botCustomerId: botCustomer.id,
            bookedServiceId: bookedService.id,
            plannedTotalDurationInMinutes: 240,
            startTimestamp: new Date(),
        }
    });
    console.log(`created market making cycle ${cycle.id} for market making`);
    console.log(`scheduling first buy job for market making cycle ${cycle.id}`);
    const nextJob = yield prisma_1.default.marketMakingJob.create({
        data: {
            buyStatus: client_1.EJobStatus.OPEN,
            sellStatus: client_1.EJobStatus.OPEN,
            cycle: {
                connect: {
                    id: cycle.id,
                },
            },
            earliestExecutionTimestampForBuy: new Date(Date.now() + 60 * 1000),
        },
    });
    console.log(`scheduled first buy job ${nextJob.id} for market making cycle ${cycle.id}`);
}));
program.command('setRequiredFieldsForDrewMarketMaking').action(() => __awaiter(void 0, void 0, void 0, function* () {
    const botCustomer = yield (0, botCustomer_1.getBotCustomerByName)('Drew');
    const cycles = yield prisma_1.default.marketMakingCycle.findMany({
        where: {
            botCustomerId: botCustomer.id
        },
    });
}));
program.command('inspectCustomerWallets').action(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const botCustomer = yield prisma_1.default.botCustomer.findFirst({
        where: {
            name: 'Drew'
        }
    });
    if (!botCustomer) {
        console.error('bot customer not found');
        return;
    }
    const foundWallets = yield prisma_1.default.botCustomerWallet.findMany({
        where: {
            botCustomerId: botCustomer.id,
            type: client_1.EWalletType.MARKET_MAKING
        }
    });
    console.log(`found ${foundWallets.length} wallets for market making`);
    console.log(foundWallets.map((wallet) => wallet.pubkey));
    const mainWallet = (0, walletUtils_1.loadWalletFromU8IntArrayStringified)(process.env.DREW_MAIN_FUNDING_WALLET);
    const balances = yield Promise.all(foundWallets.map((w) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const balance = yield config_1.connection.getBalance(new web3_js_1.PublicKey(w.pubkey));
        yield prisma_1.default.botCustomerWallet.update({
            where: {
                pubkey: w.pubkey
            },
            data: {
                latestSolBalance: balance / web3_js_1.LAMPORTS_PER_SOL
            }
        });
        const tokenAccounts = yield config_1.connection.getParsedTokenAccountsByOwner(new web3_js_1.PublicKey(w.pubkey), {
            mint: drewTokenMint
        });
        const drewTokenAccount = tokenAccounts.value.find((ta) => ta.account.data.parsed.info.mint === drewTokenMint.toBase58());
        const solBalance = balance / web3_js_1.LAMPORTS_PER_SOL;
        const drewTokenBalance = (_a = drewTokenAccount === null || drewTokenAccount === void 0 ? void 0 : drewTokenAccount.account.data.parsed.info.tokenAmount.uiAmount) !== null && _a !== void 0 ? _a : 0;
        console.log(`${w.pubkey} has ${solBalance} SOL & ${drewTokenBalance} DREW`);
        yield prisma_1.default.botCustomerWallet.update({
            where: {
                pubkey: w.pubkey
            },
            data: {
                latestSolBalance: solBalance,
                latestTokenBalance: drewTokenBalance
            }
        });
        return { solBalance, tokenAmount: drewTokenBalance };
    })));
    const mainWalletBalance = yield config_1.connection.getBalance(mainWallet.publicKey);
    const solBalance = balances.reduce((acc, curr) => acc + curr.solBalance, 0) + (mainWalletBalance / web3_js_1.LAMPORTS_PER_SOL);
    const drewTokenBalance = balances.reduce((acc, curr) => { var _a; return acc + ((_a = curr.tokenAmount) !== null && _a !== void 0 ? _a : 0); }, 0);
    const birdEyeUsdcRate = (_a = (yield (0, birdeye_1.getBirdEyeUsdcRate)(drewTokenMint.toBase58())).data.value) !== null && _a !== void 0 ? _a : 0;
    const solUsdcRate = (_b = (yield (0, birdeye_1.getBirdEyeUsdcRate)('So11111111111111111111111111111111111111112')).data.value) !== null && _b !== void 0 ? _b : 0;
    console.log('DREW/USDC rate:', birdEyeUsdcRate.toFixed(8));
    console.log('SOL/USDC rate:', solUsdcRate.toFixed(2));
    console.log('Total SOL balance:', solBalance.toFixed(2), `(~${(solBalance * solUsdcRate).toFixed(2)} USDC)`);
    console.log('Total DREW token balance:', drewTokenBalance.toFixed(2), `(~${(drewTokenBalance * birdEyeUsdcRate).toFixed(2)} USDC / ~${(drewTokenBalance * birdEyeUsdcRate / solUsdcRate).toFixed(2)} SOL)`);
}));
program.command('fundMarketMakingWallets').action(() => __awaiter(void 0, void 0, void 0, function* () {
    const botCustomer = yield prisma_1.default.botCustomer.findFirst({
        where: {
            name: 'Drew'
        }
    });
    if (!botCustomer) {
        console.error('bot customer not found');
        return;
    }
    const foundWallets = yield prisma_1.default.botCustomerWallet.findMany({
        where: {
            botCustomerId: botCustomer.id,
            type: client_1.EWalletType.MARKET_MAKING
        }
    });
    const fundingWallet = (0, walletUtils_1.loadWalletFromU8IntArrayStringified)(process.env.DREW_MAIN_FUNDING_WALLET);
    console.log(fundingWallet.publicKey.toBase58());
    const balanceOfWallet = yield config_1.connection.getBalance(fundingWallet.publicKey);
    console.log(balanceOfWallet);
    const filteredWallets = foundWallets.filter((wallet, index) => {
        return index % 2 === 1;
    });
    const walletsToFund = filteredWallets;
    const amounts = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
    const transferInstructions = [];
    console.log('Amounts to fund each wallet:', amounts);
    for (let i = 0; i < walletsToFund.length; i++) {
        const wallet = walletsToFund[i];
        const amount = amounts[i];
        console.log(`Funding wallet ${wallet.pubkey} with ${amount} SOL`);
        // Add your funding logic here
        transferInstructions.push(web3_js_1.SystemProgram.transfer({
            fromPubkey: fundingWallet.publicKey,
            toPubkey: new web3_js_1.PublicKey(wallet.pubkey),
            lamports: amount * web3_js_1.LAMPORTS_PER_SOL
        }));
        const updatedWallet = yield prisma_1.default.botCustomerWallet.update({
            where: {
                pubkey: wallet.pubkey
            },
            data: {
                latestSolBalance: amount
            }
        });
        console.log(`Updated wallet ${updatedWallet.pubkey} with ${updatedWallet.latestSolBalance} SOL`);
    }
    const { transaction, blockhash } = yield (0, solTransactionUtils_1.createTransactionForInstructions)({
        wallet: fundingWallet.publicKey.toBase58(),
        instructions: transferInstructions,
        signers: [fundingWallet],
    });
    const { txSig, confirmedResult } = yield (0, solSendTransactionUtils_1.sendAndConfirmTransactionAndRetry)(transaction, blockhash);
    console.log('Transaction sent and confirmed:', txSig, confirmedResult);
}));
program.command('executeJupiterSwap').action(() => __awaiter(void 0, void 0, void 0, function* () {
    const botCustomer = yield (0, botCustomer_1.getBotCustomerByName)('Drew');
    const wallet = yield (0, walletService_1.pickRandomWalletFromCustomer)({
        customerId: botCustomer.id,
        walletType: client_1.EWalletType.MARKET_MAKING,
        minSolBalance: 0.2,
        minTokenBalance: 0,
    });
    const decryptedWallet = (0, walletUtils_1.decryptWallet)(wallet.encryptedPrivKey);
    const { txSig, confirmedResult, actualOutputAmount, slippage, outputTokenBalance } = yield (0, jupiter_1.executeJupiterSwap)({
        inputAmount: 0.1,
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint: drewTokenMint.toBase58(),
        pubkey: decryptedWallet.publicKey,
        maxSlippage: 500
    }, decryptedWallet);
    console.log('Transaction sent and confirmed:', txSig);
    console.log('Confirmed result:', confirmedResult);
    console.log('Actual output amount:', actualOutputAmount);
    console.log('Slippage:', slippage);
    console.log('Output token balance:', outputTokenBalance);
}));
program.parse(process.argv);
