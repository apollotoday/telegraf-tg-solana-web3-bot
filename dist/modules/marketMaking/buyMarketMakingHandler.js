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
exports.handleBuyMarketMakingJob = handleBuyMarketMakingJob;
exports.updateBuyJobsWithValues = updateBuyJobsWithValues;
const client_1 = require("@prisma/client");
const walletService_1 = require("../wallet/walletService");
const jupiter_1 = require("../markets/jupiter");
const calculationUtils_1 = require("../../calculationUtils");
const config_1 = require("../../config");
const walletUtils_1 = require("../wallet/walletUtils");
const web3_js_1 = require("@solana/web3.js");
const reattempt_1 = __importDefault(require("reattempt"));
const prisma_1 = __importDefault(require("../../lib/prisma"));
function handleBuyMarketMakingJob(job) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log(`Handling buy job ${job.id} for ${job.cycle.bookedService.usedSplTokenMint} token mint for customer ${job.cycle.botCustomerId}`);
            const tokenDecimals = job.cycle.bookedService.usedSplToken.decimals;
            const wallet = yield (0, walletService_1.pickRandomWalletFromCustomer)({
                customerId: job.cycle.botCustomerId,
                walletType: client_1.EWalletType.MARKET_MAKING,
                minSolBalance: job.cycle.buyMinAmount,
                minTokenBalance: 0,
            });
            console.log(`Using wallet ${wallet.pubkey} for buy job ${job.id}`);
            const solBalance = ((_a = wallet.latestSolBalance) !== null && _a !== void 0 ? _a : 0) - 0.01;
            const randomBuyAmount = (0, calculationUtils_1.randomAmount)(job.cycle.buyMaxAmount, job.cycle.buyMinAmount, solBalance);
            const keypair = (0, walletUtils_1.decryptWallet)(wallet.encryptedPrivKey);
            const { txSig, confirmedResult, expectedOutputAmount, inputAmount, inputTokenBalance, slippage, actualOutputAmount, outputTokenBalance, } = yield reattempt_1.default.run({ times: 4, delay: 200 }, () => __awaiter(this, void 0, void 0, function* () {
                return yield (0, jupiter_1.executeJupiterSwap)({
                    pubkey: new web3_js_1.PublicKey(wallet.pubkey),
                    maxSlippage: 500,
                    inputAmount: randomBuyAmount,
                    inputMint: config_1.solTokenMint,
                    outputMint: job.cycle.bookedService.usedSplTokenMint,
                }, keypair);
            }));
            console.log(`Finished buy job ${job.id} with txSig ${txSig}, inputAmount ${inputAmount} SOL, expected: ${expectedOutputAmount / tokenDecimals} tokens, actual: ${actualOutputAmount} tokens, post balance: ${outputTokenBalance === null || outputTokenBalance === void 0 ? void 0 : outputTokenBalance.uiAmount}`);
            const minSecondsUntilSell = (0, calculationUtils_1.getRandomInt)(job.cycle.minDurationBetweenBuyAndSellInSeconds, job.cycle.maxDurationBetweenBuyAndSellInSeconds);
            // minSecondsUntilNextJob is the minimum time until the next job starts, minimum is minSecondsUntilSell + 5 seconds
            const minSecondsUntilNextJob = (0, calculationUtils_1.getRandomInt)(minSecondsUntilSell + 5, job.cycle.maxDurationBetweenJobsInSeconds);
            // SCHEDULE SELL
            const updatedJob = yield prisma_1.default.marketMakingJob.update({
                where: { id: job.id },
                data: {
                    buyTransaction: {
                        create: {
                            transactionSignature: txSig,
                            status: client_1.EOnChainTransactionStatus.SUCCESS,
                        },
                    },
                    buyWallet: {
                        connect: {
                            pubkey: wallet.pubkey,
                        },
                    },
                    solSpent: inputAmount,
                    buyExpectedTokenOutputAmount: expectedOutputAmount,
                    buyOutputTokenBalance: outputTokenBalance === null || outputTokenBalance === void 0 ? void 0 : outputTokenBalance.uiAmount,
                    buyStatus: client_1.EJobStatus.FINISHED,
                    tokenBought: actualOutputAmount,
                    earliestExecutionTimestampForSell: new Date(Date.now() + minSecondsUntilSell * 1000),
                    executedAtForBuy: new Date(),
                },
            });
            console.log(`Updated market making buy job and scheduled sell for job ${job.id} in ${minSecondsUntilNextJob} seconds`);
            const updatedWallet = yield prisma_1.default.botCustomerWallet.update({
                where: { pubkey: wallet.pubkey },
                data: {
                    latestTokenBalance: {
                        increment: actualOutputAmount,
                    },
                    latestSolBalance: {
                        decrement: inputAmount,
                    },
                },
            });
            console.log(`Updated wallet ${wallet.pubkey} with latest token balance ${updatedWallet.latestTokenBalance} and latest sol balance ${updatedWallet.latestSolBalance}`);
            const updatedCycle = yield prisma_1.default.marketMakingCycle.update({
                where: { id: job.cycleId },
                data: {
                    solSpentForCycle: {
                        increment: inputAmount,
                    },
                },
            });
            console.log(`Updated market making cycle ${job.cycleId} with sol spent for cycle ${updatedCycle.solSpentForCycle}`);
            if (updatedCycle.solSpentForCycle && updatedCycle.solSpentForCycle > updatedCycle.maxSolSpentForCycle) {
                console.log(`Market making cycle ${job.cycleId} has spent more than maxSolSpentForCycle, deactivating cycle`);
                yield prisma_1.default.marketMakingCycle.update({
                    where: { id: job.cycleId },
                    data: { isActive: false, endTimestamp: new Date() },
                });
            }
            else {
                console.log(`Market making cycle ${job.cycleId} has not spent more than maxSolSpentForCycle, keeping cycle active`);
                const nextJob = yield prisma_1.default.marketMakingJob.create({
                    data: {
                        buyStatus: client_1.EJobStatus.OPEN,
                        sellStatus: client_1.EJobStatus.OPEN,
                        cycle: {
                            connect: {
                                id: job.cycleId,
                            },
                        },
                        earliestExecutionTimestampForBuy: new Date(Date.now() + minSecondsUntilNextJob * 1000),
                    },
                });
                console.log(`Scheduled next market making buy job ${nextJob.id} for cycle ${job.cycleId} in ${minSecondsUntilNextJob} seconds`);
            }
        }
        catch (e) {
            console.log(`ERROR while handling buy job ${job.id}: ${e}`);
        }
    });
}
function updateBuyJobsWithValues() {
    return __awaiter(this, void 0, void 0, function* () {
        const buyJobs = yield prisma_1.default.marketMakingJob.findMany({
            where: {
                buyTransactionSignature: {
                    not: null
                },
                buyWalletPubkey: {
                    not: null
                },
                tokenBought: 0
            },
            include: {
                cycle: {
                    include: {
                        bookedService: true
                    }
                }
            }
        });
        for (const job of buyJobs) {
            console.log(`Updating buy job ${job.id} with signature ${job.buyTransactionSignature}`);
            if (!job.buyTransactionSignature || !job.buyWalletPubkey) {
                console.log(`Buy job ${job.id} has no transaction signature or wallet pubkey, skipping`);
                continue;
            }
            const { tokenDifference, solPreBalance, solPostBalance, outputTokenBalance, lamportsDifference, inputTokenBalance } = yield (0, jupiter_1.getBalances)({
                txSig: job.buyTransactionSignature,
                tokenMint: job.cycle.bookedService.usedSplTokenMint,
                ownerPubkey: new web3_js_1.PublicKey(job.buyWalletPubkey),
            });
            console.log(`Found token difference ${tokenDifference}, sol pre balance ${solPreBalance}, sol post balance ${solPostBalance}, output token balance ${outputTokenBalance === null || outputTokenBalance === void 0 ? void 0 : outputTokenBalance.uiAmount}, lamports difference ${lamportsDifference}, input token balance ${inputTokenBalance}`);
            const updatedWallet = yield prisma_1.default.botCustomerWallet.update({
                where: { pubkey: job.buyWalletPubkey },
                data: {
                    latestTokenBalance: {
                        increment: tokenDifference,
                    },
                },
            });
            console.log(`Updated wallet ${job.buyWalletPubkey} with latest token balance ${updatedWallet.latestTokenBalance}`);
            const updatedJob = yield prisma_1.default.marketMakingJob.update({
                where: { id: job.id },
                data: {
                    buyOutputTokenBalance: outputTokenBalance === null || outputTokenBalance === void 0 ? void 0 : outputTokenBalance.uiAmount,
                    tokenBought: tokenDifference,
                },
            });
            console.log(`Updated buy job ${job.id} with token bought ${updatedJob.tokenBought}`);
        }
    });
}
