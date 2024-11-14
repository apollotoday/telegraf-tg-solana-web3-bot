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
exports.Sol = void 0;
exports.solTransfer = solTransfer;
exports.sendAndConfirmRawTransactionAndRetry = sendAndConfirmRawTransactionAndRetry;
exports.confirmTransactionSignatureAndRetry = confirmTransactionSignatureAndRetry;
exports.sendSol = sendSol;
exports.closeWallet = closeWallet;
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("./config");
const reattempt_1 = __importDefault(require("reattempt"));
const utils_1 = require("./utils");
class Sol {
    constructor(lamports) {
        this.lamports = lamports;
        this.lamports = lamports;
    }
    get sol() {
        return this.lamports / Math.pow(10, 9);
    }
    static fromLamports(lamports) {
        return new Sol(lamports);
    }
    static fromSol(sol) {
        return new Sol(sol * Math.pow(10, 9));
    }
}
exports.Sol = Sol;
function solTransfer({ solAmount, from, to }) {
    const lamports = solAmount * web3_js_1.LAMPORTS_PER_SOL;
    const solTransfInx = web3_js_1.SystemProgram.transfer({
        fromPubkey: new web3_js_1.PublicKey(from),
        toPubkey: new web3_js_1.PublicKey(to),
        lamports: solAmount,
    });
    return solTransfInx;
}
function sendAndConfirmRawTransactionAndRetry(transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const latestBlockHash = yield config_1.connection.getLatestBlockhash();
            const { txSig, confirmedResult } = yield reattempt_1.default.run({ times: 3, delay: 200 }, () => __awaiter(this, void 0, void 0, function* () {
                console.log(`Sending transaction`);
                const [tx1, tx2, tx3] = yield Promise.all([
                    config_1.connection.sendTransaction(transaction, {
                        skipPreflight: true,
                    }),
                    config_1.connection.sendTransaction(transaction, {
                        skipPreflight: true,
                    }),
                    config_1.connection.sendTransaction(transaction, {
                        skipPreflight: true,
                    }),
                ]);
                console.log(`Sent transaction`, { tx1 });
                const confirmedResult = yield confirmTransactionSignatureAndRetry(tx1, Object.assign({}, latestBlockHash));
                console.log(`Confirmed transaction`, confirmedResult);
                return { txSig: tx1, confirmedResult };
            }));
            console.log({ txSig, confirmedResult });
            console.log("Successfully sent transaction: ", txSig);
            return { txSig, confirmedResult };
        }
        catch (e) {
            console.error("Failed to send transaction: ", e);
            throw new Error("Please retry! Failed to send transaction: " + e);
        }
    });
}
function confirmTransactionSignatureAndRetry(txSig, blockhash, skipConfirmation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield reattempt_1.default.run({ times: 3, delay: 200 }, () => __awaiter(this, void 0, void 0, function* () {
                return yield config_1.connection.confirmTransaction({
                    blockhash: blockhash.blockhash,
                    lastValidBlockHeight: blockhash.lastValidBlockHeight,
                    signature: txSig,
                }, "confirmed");
            }));
        }
        catch (e) {
            console.error("Failed to confirm transaction: ", e);
            throw new Error("Please retry! Failed to confirm transaction: " + e);
        }
    });
}
function sendSol(args) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 20000,
            }),
            web3_js_1.SystemProgram.transfer({
                fromPubkey: args.from.publicKey,
                toPubkey: args.to,
                lamports: args.amount.lamports,
            }),
        ];
        const blockhash = yield config_1.connection.getLatestBlockhash();
        const messageV0 = new web3_js_1.TransactionMessage({
            payerKey: (_b = (_a = args === null || args === void 0 ? void 0 : args.feePayer) === null || _a === void 0 ? void 0 : _a.publicKey) !== null && _b !== void 0 ? _b : args.from.publicKey,
            recentBlockhash: blockhash.blockhash,
            instructions,
        }).compileToV0Message();
        const transaction = new web3_js_1.VersionedTransaction(messageV0);
        // sign your transaction with the required `Signers`
        const signers = [args.from];
        if (args.feePayer)
            signers.push(args.feePayer);
        transaction.sign(signers);
        // Send the transaction
        return yield sendAndConfirmRawTransactionAndRetry(transaction);
    });
}
function closeWallet(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const { waitTime = 5000 } = args;
        const waitPerRetry = 500;
        const retries = Math.floor(waitTime / waitPerRetry);
        let balance = 0;
        for (let i = 0; i < retries; i++) {
            balance = yield config_1.connection.getBalance(args.from.publicKey);
            if (balance > 0) {
                break;
            }
            yield (0, utils_1.sleep)(waitPerRetry);
        }
        return yield sendSol({ from: args.from, to: args.to.publicKey, amount: Sol.fromLamports(balance), feePayer: args.to });
    });
}
