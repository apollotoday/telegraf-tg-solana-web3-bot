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
exports.pickRandomWalletFromCustomer = pickRandomWalletFromCustomer;
exports.createVolumeBot = createVolumeBot;
exports.createBotCustomerWallets = createBotCustomerWallets;
exports.createAndStoreBotCustomerWallets = createAndStoreBotCustomerWallets;
exports.getDepositWalletFromCustomer = getDepositWalletFromCustomer;
exports.setupRankingWallets = setupRankingWallets;
exports.setupRankingService = setupRankingService;
const client_1 = require("@prisma/client");
const config_1 = require("../../config");
const solUtils_1 = require("../../solUtils");
const walletUtils_1 = require("./walletUtils");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../../utils");
const bookedService_1 = require("../customer/bookedService");
function pickRandomWalletFromCustomer(_a) {
    return __awaiter(this, arguments, void 0, function* ({ customerId, walletType, minSolBalance, minTokenBalance }) {
        const foundWallets = yield prisma_1.default.botCustomerWallet.findMany({
            where: {
                botCustomerId: customerId,
                type: walletType,
                isActive: true,
                latestSolBalance: {
                    gt: minSolBalance,
                },
                latestTokenBalance: {
                    gt: minTokenBalance,
                },
            },
        });
        console.log(`Picking random wallet from ${foundWallets.length} wallets for customerId=${customerId} with type=${walletType} and minSolBalance=${minSolBalance} and minTokenBalance=${minTokenBalance}`);
        const randomWallet = foundWallets[Math.floor(Math.random() * foundWallets.length)];
        if (!randomWallet) {
            throw new Error(`No wallet found for customerId=${customerId} with type=${walletType} and minSolBalance=${minSolBalance} and minTokenBalance=${minTokenBalance}`);
        }
        console.log(`Picked random wallet: ${randomWallet.pubkey}`);
        return randomWallet;
    });
}
function createVolumeBot(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const newWallet = (0, walletUtils_1.generateAndEncryptWallet)();
        const res = yield prisma_1.default.bookedService.create({
            data: {
                type: client_1.EServiceType.RANKING,
                botCustomer: {
                    connect: {
                        id: args.customerId,
                    },
                },
                usedSplToken: {
                    connect: {
                        tokenMint: args.usedSplTokenMint,
                    },
                },
                mainWallet: {
                    create: {
                        encryptedPrivKey: newWallet.encryptedPrivKey,
                        pubkey: newWallet.pubkey,
                        type: client_1.EWalletType.SERVICE_FUNDING,
                        botCustomerId: args.customerId,
                    },
                },
            },
            include: {
                mainWallet: true,
            },
        });
        console.log('res', res.mainWalletId);
        while (true) {
            const balance = yield config_1.connection.getBalance(new web3_js_1.PublicKey(res.mainWalletId));
            if (balance > 1000) {
                console.log('balance received', balance);
                break;
            }
            yield (0, utils_1.sleep)(1000);
        }
    });
}
function createBotCustomerWallets({ subWalletCount }) {
    const wallets = Array.from({ length: subWalletCount }).map((i) => {
        const subWallet = (0, walletUtils_1.generateAndEncryptWallet)();
        return subWallet;
    });
    return wallets;
}
function createAndStoreBotCustomerWallets(_a) {
    return __awaiter(this, arguments, void 0, function* ({ customerId, subWalletCount, walletType, }) {
        const wallets = createBotCustomerWallets({
            subWalletCount,
        });
        return yield prisma_1.default.botCustomerWallet.createMany({
            data: wallets.map((wallet) => ({
                pubkey: wallet.pubkey,
                encryptedPrivKey: wallet.encryptedPrivKey,
                botCustomerId: customerId,
                type: walletType,
            })),
        });
    });
}
function getDepositWalletFromCustomer(_a) {
    return __awaiter(this, arguments, void 0, function* ({ botCustomerId }) {
        const depositWallets = yield prisma_1.default.botCustomerWallet.findMany({
            where: {
                botCustomerId,
                type: client_1.EWalletType.DEPOSIT,
            },
        });
        if (depositWallets.length === 0) {
            console.log(`ERR: No deposit wallet found for botCustomerId=${botCustomerId}`);
            throw new Error('No deposit wallet found');
        }
        if (depositWallets.length > 1) {
            console.log(`WARN: There is more than one deposit wallet for botCustomerId=${botCustomerId} `);
        }
        return depositWallets[0];
    });
}
function setupRankingWallets({ fundingWallet, totalSol }) {
    const walletCountToCreate = Math.floor(totalSol / config_1.fundsToSendForRanking);
    const wallets = createBotCustomerWallets({ subWalletCount: walletCountToCreate });
    const instructions = [];
    for (const wallet of wallets) {
        instructions.push((0, solUtils_1.solTransfer)({
            from: fundingWallet,
            to: wallet.pubkey,
            solAmount: config_1.fundsToSendForRanking,
        }));
    }
    return {
        wallets,
        instructions,
    };
}
function setupRankingService(_a) {
    return __awaiter(this, arguments, void 0, function* ({ botCustomerId, totalSol, usedSplTokenMint }) {
        const [depositWallet, bookedService] = yield Promise.all([
            getDepositWalletFromCustomer({ botCustomerId }),
            (0, bookedService_1.createBookedServiceAndWallet)({
                botCustomerId,
                solAmount: totalSol,
                serviceType: client_1.EServiceType.RANKING,
                usedSplTokenMint,
            }),
        ]);
        const initDepositIx = (0, solUtils_1.solTransfer)({
            solAmount: totalSol,
            from: depositWallet.pubkey,
            to: bookedService.mainWalletId,
        });
        const solToDistributeToSubWallets = totalSol - 0.2;
        const { wallets, instructions } = setupRankingWallets({
            fundingWallet: bookedService.mainWalletId,
            totalSol,
        });
        const tx = new web3_js_1.Transaction();
        const updateCPInx = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 101000 });
        const updateCLInx = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 1399000 });
        tx.add(updateCLInx);
        tx.add(updateCLInx);
        tx.add(initDepositIx);
        tx.add(...instructions);
    });
}
