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
exports.sendAndConfirmTransactionAndRetry = sendAndConfirmTransactionAndRetry;
exports.sendAndConfirmRawTransactionAndRetry = sendAndConfirmRawTransactionAndRetry;
exports.confirmTransactionSignatureAndRetry = confirmTransactionSignatureAndRetry;
const reattempt_1 = __importDefault(require("reattempt"));
const config_1 = require("../../config");
const client_1 = require("@prisma/client");
function sendAndConfirmTransactionAndRetry(transaction, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
        });
        return sendAndConfirmRawTransactionAndRetry(serializedTransaction, blockhash);
    });
}
function sendAndConfirmRawTransactionAndRetry(serializedTransaction, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { txSig, confirmedResult } = yield reattempt_1.default.run({ times: 6, delay: 600 }, () => __awaiter(this, void 0, void 0, function* () {
                console.log(`Sending transaction`);
                const [tx1, tx2, tx3] = yield Promise.all([
                    config_1.connection.sendRawTransaction(serializedTransaction, {
                        skipPreflight: true,
                    }),
                    config_1.connection.sendRawTransaction(serializedTransaction, {
                        skipPreflight: true,
                    }),
                    config_1.connection.sendRawTransaction(serializedTransaction, {
                        skipPreflight: true,
                    }),
                ]);
                console.log(`Sent transaction`, { tx1, tx2, tx3 });
                const confirmedResult = yield confirmTransactionSignatureAndRetry(tx1, Object.assign({}, blockhash));
                console.log(`Confirmed transaction`, confirmedResult);
                return { txSig: tx1, confirmedResult };
            }));
            console.log({ txSig, confirmedResult });
            console.log('Successfully sent transaction: ', txSig);
            return { txSig, confirmedResult };
        }
        catch (e) {
            console.error('Failed to send transaction: ', e);
            throw new Error('Please retry! Failed to send transaction: ' + e);
        }
    });
}
function confirmTransactionSignatureAndRetry(txSig, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const confirmedSigResult = yield reattempt_1.default.run({ times: 6, delay: 600 }, () => __awaiter(this, void 0, void 0, function* () {
                return yield config_1.connection.confirmTransaction({
                    blockhash: blockhash.blockhash,
                    lastValidBlockHeight: blockhash.lastValidBlockHeight,
                    signature: txSig,
                }, 'confirmed');
            }));
            console.log('Successfully confirmed transaction: ', txSig, confirmedSigResult, 'err', (_a = confirmedSigResult.value) === null || _a === void 0 ? void 0 : _a.err);
            return {
                status: !!((_b = confirmedSigResult.value) === null || _b === void 0 ? void 0 : _b.err) ? client_1.EOnChainTransactionStatus.FAILED : client_1.EOnChainTransactionStatus.SUCCESS,
                value: confirmedSigResult.value,
                errorMessage: !!((_c = confirmedSigResult.value) === null || _c === void 0 ? void 0 : _c.err) ? confirmedSigResult.value.err.toString() : undefined,
            };
        }
        catch (e) {
            console.error('Failed to confirm transaction: ', e);
            throw new Error('Please retry! Failed to confirm transaction: ' + e);
        }
    });
}
