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
exports.handleSellMarketMakingJob = handleSellMarketMakingJob;
const client_1 = require("@prisma/client");
const walletService_1 = require("../wallet/walletService");
const calculationUtils_1 = require("../../calculationUtils");
const walletUtils_1 = require("../wallet/walletUtils");
const reattempt_1 = __importDefault(require("reattempt"));
const jupiter_1 = require("../markets/jupiter");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../../config");
const prisma_1 = __importDefault(require("../../lib/prisma"));
function handleSellMarketMakingJob(job) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log(`Handling sell job ${job.id} for ${job.cycle.bookedService.usedSplTokenMint} token mint for customer ${job.cycle.botCustomerId}`);
            if (!job.tokenBought) {
                console.log(`Job ${job.id} has no token bought, skipping`);
                return;
            }
            const variance = 0.3;
            const minSellAmount = job.cycle.sellToBuyValueRatio * job.tokenBought * (1 - variance);
            const maxSellAmount = job.cycle.sellToBuyValueRatio * job.tokenBought * (1 + variance);
            const wallet = yield (0, walletService_1.pickRandomWalletFromCustomer)({
                customerId: job.cycle.botCustomerId,
                walletType: client_1.EWalletType.MARKET_MAKING,
                minSolBalance: 0.005,
                minTokenBalance: minSellAmount,
            });
            const preSolBalanceFromConn = yield config_1.connection.getBalance(new web3_js_1.PublicKey(wallet.pubkey), 'recent');
            const inputSellAmount = (0, calculationUtils_1.randomAmount)(maxSellAmount, minSellAmount, (_a = wallet.latestTokenBalance) !== null && _a !== void 0 ? _a : 0);
            console.log(`Using wallet ${wallet.pubkey} for buy job ${job.id} to sell ${inputSellAmount} tokens`);
            const keypair = (0, walletUtils_1.decryptWallet)(wallet.encryptedPrivKey);
            const { txSig, confirmedResult, expectedOutputAmount, inputAmount, inputTokenBalance, slippage, actualOutputAmount, outputTokenBalance, solPreBalance, solPostBalance, } = yield reattempt_1.default.run({ times: 4, delay: 200 }, () => __awaiter(this, void 0, void 0, function* () {
                return yield (0, jupiter_1.executeJupiterSwap)({
                    pubkey: new web3_js_1.PublicKey(wallet.pubkey),
                    maxSlippage: 500,
                    inputAmount: inputSellAmount,
                    inputMint: job.cycle.bookedService.usedSplTokenMint,
                    outputMint: config_1.solTokenMint,
                }, keypair);
            }));
            const postSolBalanceFromConn = yield config_1.connection.getBalance(new web3_js_1.PublicKey(wallet.pubkey), 'recent');
            const solEarned = postSolBalanceFromConn - preSolBalanceFromConn;
            console.log({ postSolBalanceFromConn, preSolBalanceFromConn, solEarned });
            console.log(`Finished sell job ${job.id} with txSig ${txSig}, sold ${inputAmount} tokens, expected: ${expectedOutputAmount / web3_js_1.LAMPORTS_PER_SOL} SOL, actual: ${solEarned / web3_js_1.LAMPORTS_PER_SOL} SOL, post balance: ${solPostBalance / web3_js_1.LAMPORTS_PER_SOL} SOL`);
            // SCHEDULE SELL
            const updatedJob = yield prisma_1.default.marketMakingJob.update({
                where: { id: job.id },
                data: {
                    sellTransaction: {
                        create: {
                            transactionSignature: txSig,
                            status: client_1.EOnChainTransactionStatus.SUCCESS,
                        }
                    },
                    sellWallet: {
                        connect: {
                            pubkey: wallet.pubkey,
                        }
                    },
                    solEarned: solEarned,
                    sellExpectedSolOutputAmount: expectedOutputAmount,
                    sellOutputSolBalance: postSolBalanceFromConn,
                    sellStatus: client_1.EJobStatus.FINISHED,
                    tokenSold: inputAmount,
                    executedAtForSell: new Date(),
                },
            });
            console.log(`Updated market making sell job for job ${job.id}`);
            const updatedWallet = yield prisma_1.default.botCustomerWallet.update({
                where: { pubkey: wallet.pubkey },
                data: {
                    latestTokenBalance: {
                        decrement: inputAmount,
                    },
                    latestSolBalance: {
                        increment: solEarned,
                    },
                },
            });
            console.log(`Updated wallet ${wallet.pubkey} with latest token balance ${updatedWallet.latestTokenBalance} and latest sol balance ${updatedWallet.latestSolBalance}`);
            const updatedCycle = yield prisma_1.default.marketMakingCycle.update({
                where: { id: job.cycleId },
                data: {
                    solSpentForCycle: {
                        decrement: solEarned,
                    },
                },
            });
            console.log(`Updated market making cycle ${job.cycleId} with sol spent for cycle ${updatedCycle.solSpentForCycle}`);
        }
        catch (e) {
            console.log(`ERROR while handling sell job ${job.id}: ${e}`);
        }
    });
}
