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
exports.getMeteoraPool = getMeteoraPool;
exports.swap = swap;
exports.buySell = buySell;
exports.buySellVersioned = buySellVersioned;
exports.fakeVolumne = fakeVolumne;
const web3_js_1 = require("@solana/web3.js");
const dynamic_amm_sdk_1 = __importDefault(require("@mercurial-finance/dynamic-amm-sdk"));
const anchor_1 = require("@project-serum/anchor");
const config_1 = require("../../config");
const calculationUtils_1 = require("../../calculationUtils");
// Connection, Wallet, and AnchorProvider to interact with the network
function getMeteoraPool(pubkey) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield dynamic_amm_sdk_1.default.create(config_1.connection, new web3_js_1.PublicKey(pubkey));
        return pool;
    });
}
function swap(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type = "buy" } = input;
        const pool = yield getMeteoraPool(input.pool);
        console.log("pool", pool.address);
        const inToken = type === "buy" ? pool.tokenAMint : pool.tokenBMint;
        const outToken = type === "buy" ? pool.tokenBMint : pool.tokenAMint;
        //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
        const inAmountLamport = new anchor_1.BN(input.inLamports);
        // Swap SOL → TOKEN
        const { minSwapOutAmount, swapOutAmount } = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
        const minOutAmount = minSwapOutAmount;
        const _swapTx = yield pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, minOutAmount);
        _swapTx.feePayer = input.feePayer.publicKey;
        const recentBlockhash = yield config_1.connection.getLatestBlockhash();
        const txMsg = new web3_js_1.TransactionMessage({
            instructions: _swapTx.instructions,
            payerKey: input.feePayer.publicKey,
            recentBlockhash: recentBlockhash.blockhash,
        }).compileToV0Message();
        const swapTx = new web3_js_1.VersionedTransaction(txMsg);
        swapTx.sign([input.swapWallet, input.feePayer]);
        console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());
        console.log("sending swap tx");
        //const swapResult = await provider.sendAndConfirm(swapTx);
        console.log(`Swap ${input.inLamports / Math.pow(10, inToken.decimals)} ${inToken.address} to ${swapOutAmount.toNumber() / Math.pow(10, outToken.decimals)} ${outToken.address}`);
        return {
            swapTx,
            inToken,
            outToken,
            minOutAmount: minOutAmount.toNumber(),
            outAmountLamport: swapOutAmount.toNumber(),
            pool,
        };
    });
}
function buySell(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const { type = "AToB" } = input;
        const pool = yield getMeteoraPool(input.pool);
        console.log("pool", pool.address);
        const inToken = pool.tokenAMint;
        const outToken = pool.tokenBMint;
        //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
        const inAmountLamport = new anchor_1.BN(input.inLamports);
        // Swap SOL → TOKEN
        const buyQuote = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
        const sellQuote = pool.getSwapQuote(outToken.address, buyQuote.swapOutAmount, input.slippage);
        const [buyTx, sellTx] = yield Promise.all([
            pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, buyQuote.minSwapOutAmount),
            pool.swap(input.swapWallet.publicKey, outToken.address, buyQuote.swapOutAmount, sellQuote.minSwapOutAmount),
        ]);
        buyTx.recentBlockhash;
        console.log("buyTx latestBlockhash", buyTx.recentBlockhash);
        buyTx.feePayer = input.feePayer.publicKey;
        sellTx.feePayer = input.feePayer.publicKey;
        //swapTx.sign(input.feePayer);
        buyTx.sign(input.swapWallet);
        sellTx.sign(input.swapWallet);
        console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());
        console.log("sending swap tx");
        //const swapResult = await provider.sendAndConfirm(swapTx);
        console.log(`Swap ${input.inLamports / Math.pow(10, inToken.decimals)} ${inToken.address} to ${buyQuote.swapOutAmount.toNumber() / Math.pow(10, outToken.decimals)} ${outToken.address}`);
        console.log(`
    Swap ${buyQuote.swapOutAmount.toNumber() / Math.pow(10, inToken.decimals)} ${outToken.address} to ${sellQuote.swapOutAmount.toNumber() / Math.pow(10, outToken.decimals)} ${inToken.address}`);
        return {
            buyTx,
            sellTx,
            inToken,
            outToken,
            pool,
        };
    });
}
function buySellVersioned(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield getMeteoraPool(input.pool);
        console.log("pool", pool.address);
        const inToken = pool.tokenAMint;
        const outToken = pool.tokenBMint;
        //const inAmountLamport = typeof input.inLamports == "number" ? new BN(input.inLamports * 10 ** inToken.decimals) : input.inLamports;
        const inAmountLamport = new anchor_1.BN(input.inLamports);
        const [_buyAmount1, _buyAmount2] = (0, calculationUtils_1.calculatePartionedSwapAmount)(input.inLamports, 2, 0.1);
        const buyAmount1 = new anchor_1.BN(_buyAmount1);
        const buyAmount2 = new anchor_1.BN(_buyAmount2);
        // Swap SOL → TOKEN
        const buyQuote1 = pool.getSwapQuote(inToken.address, inAmountLamport, input.slippage);
        const buyQuote2 = pool.getSwapQuote(inToken.address, buyAmount2, input.slippage);
        let sellAmount = new anchor_1.BN((buyQuote1.swapOutAmount.toNumber() + buyQuote2.swapOutAmount.toNumber()) * 0.95);
        sellAmount = new anchor_1.BN(buyQuote1.swapOutAmount.toNumber() * 0.95);
        const sellQuote = pool.getSwapQuote(outToken.address, sellAmount, input.slippage);
        console.log("buyQuote.swapOutAmount", sellAmount.toNumber());
        const [_buyTx1, _buyTx2, _sellTx] = yield Promise.all([
            pool.swap(input.swapWallet.publicKey, inToken.address, inAmountLamport, buyQuote1.minSwapOutAmount),
            pool.swap(input.swapWallet.publicKey, inToken.address, buyAmount2, buyQuote2.minSwapOutAmount),
            pool.swap(input.swapWallet.publicKey, outToken.address, sellAmount, sellQuote.minSwapOutAmount),
        ]);
        function convertToVersionedTransaction(tx) {
            return new web3_js_1.VersionedTransaction(new web3_js_1.TransactionMessage({
                instructions: [...tx.instructions],
                payerKey: input.feePayer.publicKey,
                recentBlockhash: tx.recentBlockhash,
            }).compileToV0Message());
        }
        const buyTx1 = convertToVersionedTransaction(_buyTx1);
        const buyTx2 = convertToVersionedTransaction(_buyTx2);
        const sellTx = convertToVersionedTransaction(_sellTx);
        //swapTx.sign(input.feePayer);
        buyTx1.sign([input.swapWallet]);
        buyTx2.sign([input.swapWallet]);
        sellTx.sign([input.swapWallet]);
        console.log("input.swapWallet", input.swapWallet.publicKey.toBase58());
        console.log("sending swap tx");
        //const swapResult = await provider.sendAndConfirm(swapTx);
        console.log(`Swap ${input.inLamports / Math.pow(10, inToken.decimals)} ${inToken.address} to ${buyQuote1.swapOutAmount.toNumber() / Math.pow(10, outToken.decimals)} ${outToken.address}`);
        console.log(`
    Swap ${sellAmount.toNumber() / Math.pow(10, inToken.decimals)} ${outToken.address} to ${sellQuote.swapOutAmount.toNumber() / Math.pow(10, outToken.decimals)} ${inToken.address}`);
        return {
            buyTx1,
            buyTx2,
            sellTx,
            inToken,
            outToken,
            pool,
        };
    });
}
function fakeVolumne(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const buyAmount1 = args.amountLamports * 0.52;
        const buyAmount2 = args.amountLamports * 0.48;
        const [buyRes1, buyRes2] = yield Promise.all([
            swap({
                inLamports: buyAmount1,
                swapWallet: args.wallet,
                slippage: 50,
                feePayer: args.wallet,
                pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            }),
            swap({
                inLamports: buyAmount2,
                swapWallet: args.wallet,
                slippage: 50,
                feePayer: args.wallet,
                pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            }),
        ]);
        const sellAmount = buyRes1.outAmountLamport + buyRes2.outAmountLamport;
        const sellRes = yield swap({
            inLamports: sellAmount,
            swapWallet: args.wallet,
            slippage: 50,
            feePayer: args.wallet,
            pool: new web3_js_1.PublicKey(config_1.meteoraDynPool),
            type: "sell",
        });
        // await sendAndConfirmJitoTransactions([buyRes1.swapTx, buyRes2.swapTx, sellRes.swapTx], args.wallet);
    });
}
