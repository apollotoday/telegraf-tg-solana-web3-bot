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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJupiterQuoteLink = void 0;
exports.getJupiterQuote = getJupiterQuote;
exports.setupJupiterSwap = setupJupiterSwap;
exports.executeJupiterSwap = executeJupiterSwap;
const web3_js_1 = require("@solana/web3.js");
const solUtils_1 = require("../../solUtils");
const config_1 = require("../../config");
const fetchJupiterQuoteLink = (inputMint, outputMint, amount, slippageBps, swapMode, dex) => __awaiter(void 0, void 0, void 0, function* () {
    const link = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&swapMode=${swapMode}${dex ? '&dexes=Raydium%20CP' : ''}`;
    console.log(link);
    while (true) {
        try {
            const res = yield fetch(link);
            return res;
        }
        catch (e) { }
    }
});
exports.fetchJupiterQuoteLink = fetchJupiterQuoteLink;
function getJupiterQuote(input) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { inputAmount, maxSlippage: slippage, inputMint, outputMint } = input;
            const initAmount = Math.round(inputAmount * web3_js_1.LAMPORTS_PER_SOL);
            const link1 = yield (0, exports.fetchJupiterQuoteLink)(inputMint, outputMint, initAmount.toString(), slippage.toString(), 'ExactIn', false);
            const getQuoteEst = yield link1.json();
            const outAmount = Number(getQuoteEst.outAmount);
            console.log(`Fetching jupiter quote ${inputAmount} ${inputMint} to ${outAmount} ${outputMint}`);
            return {
                inputAmount: inputAmount,
                tokenOutputAmount: outAmount,
                quote: getQuoteEst,
            };
        }
        catch (e) {
            console.log('Failed to fetch jupiter quote', e);
            throw e;
        }
    });
}
function setupJupiterSwap(_a) {
    return __awaiter(this, arguments, void 0, function* ({ quote, swapInput, }) {
        try {
            const { pubkey, inputAmount, maxSlippage: slippage, inputMint, outputMint } = swapInput;
            const outputAmount = Number(quote.outAmount);
            console.log(`Swapping ${inputAmount} ${inputMint} to ${outputAmount} ${outputMint}`);
            const { swapTransaction } = yield (yield fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: pubkey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 'auto',
                    dynamicSlippage: {
                        maxBps: slippage,
                    },
                }),
            })).json();
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
            return {
                transaction,
                outputAmount,
            };
        }
        catch (e) {
            console.log('Failed to setup jupiter swap', e);
            throw e;
        }
    });
}
function executeJupiterSwap(_a, feePayer_1) {
    return __awaiter(this, arguments, void 0, function* ({ inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage }, feePayer) {
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        const { quote, inputAmount: tokenInputAmount, tokenOutputAmount, } = yield getJupiterQuote({ inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage });
        const { transaction, outputAmount } = yield setupJupiterSwap({
            quote,
            swapInput: { inputAmount, inputMint, outputMint, pubkey, maxSlippage: slippage },
        });
        transaction.sign([feePayer]);
        const { txSig, confirmedResult } = yield (0, solUtils_1.sendAndConfirmRawTransactionAndRetry)(transaction);
        const detectedTransaction = yield config_1.connection.getParsedTransaction(txSig, { commitment: 'confirmed', maxSupportedTransactionVersion: 200 });
        const inputTokenBalance = (_d = (_c = (_b = detectedTransaction === null || detectedTransaction === void 0 ? void 0 : detectedTransaction.meta) === null || _b === void 0 ? void 0 : _b.preTokenBalances) === null || _c === void 0 ? void 0 : _c.find(b => b.mint === outputMint && b.owner === pubkey.toString())) === null || _d === void 0 ? void 0 : _d.uiTokenAmount.uiAmount;
        const outputTokenBalance = (_g = (_f = (_e = detectedTransaction === null || detectedTransaction === void 0 ? void 0 : detectedTransaction.meta) === null || _e === void 0 ? void 0 : _e.postTokenBalances) === null || _f === void 0 ? void 0 : _f.find(b => b.mint === outputMint && b.owner === pubkey.toString())) === null || _g === void 0 ? void 0 : _g.uiTokenAmount.uiAmount;
        const actualOutputAmount = (outputTokenBalance !== null && outputTokenBalance !== void 0 ? outputTokenBalance : 0) - (inputTokenBalance !== null && inputTokenBalance !== void 0 ? inputTokenBalance : 0);
        const solPreBalance = (_l = (_k = (_j = (_h = detectedTransaction === null || detectedTransaction === void 0 ? void 0 : detectedTransaction.meta) === null || _h === void 0 ? void 0 : _h.preTokenBalances) === null || _j === void 0 ? void 0 : _j.find(b => b.mint === config_1.solTokenMint && b.owner === pubkey.toString())) === null || _k === void 0 ? void 0 : _k.uiTokenAmount.uiAmount) !== null && _l !== void 0 ? _l : 0;
        const solPostBalance = (_q = (_p = (_o = (_m = detectedTransaction === null || detectedTransaction === void 0 ? void 0 : detectedTransaction.meta) === null || _m === void 0 ? void 0 : _m.postTokenBalances) === null || _o === void 0 ? void 0 : _o.find(b => b.mint === config_1.solTokenMint && b.owner === pubkey.toString())) === null || _p === void 0 ? void 0 : _p.uiTokenAmount.uiAmount) !== null && _q !== void 0 ? _q : 0;
        return {
            txSig,
            confirmedResult,
            inputAmount,
            expectedOutputAmount: outputAmount,
            actualOutputAmount,
            slippage: (actualOutputAmount / outputAmount) * 100,
            inputTokenBalance,
            outputTokenBalance,
            solPreBalance,
            solPostBalance,
        };
    });
}
