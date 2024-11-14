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
const web3_js_1 = require("@solana/web3.js");
const meteora_1 = require("./meteora");
const testUtils_1 = require("../../testUtils");
const solUtils_1 = require("../../solUtils");
const config_1 = require("../../config");
const jitoUtils_1 = require("../../jitoUtils");
const utils_1 = require("../../utils");
const lodash_1 = __importDefault(require("lodash"));
let testWallet;
// beforeAll(async () => {
//   testWallet = await fundTestWallet({ amount: Sol.fromSol(0.0011) });
// });
// afterAll(async () => {
//   await closeWallet({ from: testWallet, to: getDevWallet().publicKey });
// });
const devWallet = (0, testUtils_1.getDevWallet)();
const devWallet2 = (0, testUtils_1.getDevWallet)(2);
test("should buy and sell drew", () => __awaiter(void 0, void 0, void 0, function* () {
    let failed = 0;
    try {
        const buyRes = yield (0, meteora_1.swap)({
            inLamports: solUtils_1.Sol.fromSol(0.01).lamports,
            feePayer: devWallet,
            swapWallet: devWallet,
            slippage: 50,
            pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
        });
        const sellRes = yield (0, meteora_1.swap)({
            inLamports: buyRes.outAmountLamport * 0.99,
            swapWallet: devWallet,
            feePayer: devWallet,
            slippage: 50,
            pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            type: "sell",
        });
        yield (0, jitoUtils_1.sendAndConfirmJitoTransactions)({
            transactions: [buyRes.swapTx, sellRes.swapTx],
            payer: devWallet,
        });
    }
    catch (e) {
        console.log(e);
        failed++;
    }
    console.log("failed", failed);
}));
test("should buy and sell drew fast", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, utils_1.measureTime)("buySell", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, meteora_1.buySellVersioned)({
            swapWallet: devWallet,
            feePayer: devWallet,
            inLamports: solUtils_1.Sol.fromSol(lodash_1.default.random(0.0095, 0.0105)).lamports,
            pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            slippage: 50,
        });
        return res;
    }));
    yield (0, utils_1.measureTime)("sendAndConfirmJitoTransactions", () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, jitoUtils_1.sendAndConfirmJitoTransactions)({
            transactions: [
                res.buyTx1,
                res.sellTx
            ],
            payer: devWallet,
        });
    }));
}));
test("should fake volumne", () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, meteora_1.fakeVolumne)({ wallet: devWallet, amountLamports: solUtils_1.Sol.fromSol(0.01).lamports });
}));
test("ranking bot", () => __awaiter(void 0, void 0, void 0, function* () {
    let errorCount = 0;
    yield Promise.all(Array.from({ length: 30 }).map(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const buyRes = yield (0, meteora_1.swap)({
                swapWallet: devWallet,
                feePayer: devWallet,
                inLamports: solUtils_1.Sol.fromSol(0.000001).lamports,
                slippage: 50,
                pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            });
            yield (0, solUtils_1.sendAndConfirmRawTransactionAndRetry)(buyRes.swapTx);
        }
        catch (e) {
            errorCount++;
            console.log(e);
        }
    })));
    console.log("errorCount", errorCount);
}));
