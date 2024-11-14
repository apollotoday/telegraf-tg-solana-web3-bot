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
exports.getPoolkeys = exports.BaseRay = void 0;
exports.formatAmmKeysById = formatAmmKeysById;
exports.getRaydiumPoolsByTokenAddress = getRaydiumPoolsByTokenAddress;
exports.swapRay = swapRay;
exports.swapRaydium = swapRaydium;
exports.fakeVolumneTransaction = fakeVolumneTransaction;
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const bigint_buffer_1 = require("bigint-buffer");
const web3_js_2 = require("@solana/web3.js");
// import { connection, puffAddr, solAddr } from "../../config"
const config_1 = require("../../config");
const calculationUtils_1 = require("../../calculationUtils");
const jitoUtils_1 = require("../../jitoUtils");
class BaseRay {
    constructor() {
        this.ixsAdderCallback = (ixs = []) => {
            this.cacheIxs.push(...ixs);
        };
        this.reInit = () => (this.cacheIxs = []);
        this.getPoolInfo = (poolId) => this.pools.get(poolId);
        this.cacheIxs = [];
        this.cachedPoolKeys = new Map();
        this.pools = new Map();
        if (config_1.net == "devnet") {
            console.log("devnet");
            this.ammProgramId = new web3_js_1.PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8");
            this.feeDestinationId = new web3_js_1.PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR");
            this.orderBookProgramId = new web3_js_1.PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj");
        }
        else {
            console.log("mainnet");
            this.ammProgramId = new web3_js_1.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
            this.feeDestinationId = new web3_js_1.PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5");
            this.orderBookProgramId = new web3_js_1.PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");
        }
    }
    getMarketInfo(marketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const marketAccountInfo = yield config_1.connection.getAccountInfo(marketId, "confirmed").catch((error) => null);
            if (!marketAccountInfo)
                throw "Market not found";
            try {
                return raydium_sdk_1.Market.getLayouts(3).state.decode(marketAccountInfo.data);
            }
            catch (parseMeketDataError) {
                // log({ parseMeketDataError })
            }
            return null;
        });
    }
    getPoolKeys(poolId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.pools)
                this.pools = new Map();
            if (!this.cachedPoolKeys)
                this.cachedPoolKeys = new Map();
            const cache2 = this.cachedPoolKeys.get(poolId.toBase58());
            if (cache2) {
                return cache2;
            }
            // const cache = this.pools.get(poolId.toBase58())
            // if (cache) {
            //   return jsonInfo2PoolKeys(cache) as LiquidityPoolKeys
            // }
            const accountInfo = yield config_1.connection.getAccountInfo(poolId);
            if (!accountInfo)
                throw "Pool info not found";
            let poolState = undefined;
            let version = undefined;
            let poolAccountOwner = accountInfo.owner;
            if (accountInfo.data.length == raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.span) {
                poolState = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);
                version = 4;
            }
            else if (accountInfo.data.length == raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V5.span) {
                poolState = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V5.decode(accountInfo.data);
                version = 5;
            }
            else
                throw "Invalid Pool data lenght";
            if (!poolState || !version)
                throw "Invalid pool address";
            let { authority, baseDecimals, baseMint, baseVault, configId, id, lookupTableAccount, lpDecimals, lpMint, lpVault, marketAuthority, marketId, marketProgramId, marketVersion, nonce, openOrders, programId, quoteDecimals, quoteMint, quoteVault, targetOrders, 
            // version,
            withdrawQueue, } = raydium_sdk_1.Liquidity.getAssociatedPoolKeys({
                baseMint: poolState.baseMint,
                baseDecimals: poolState.baseDecimal.toNumber(),
                quoteMint: poolState.quoteMint,
                quoteDecimals: poolState.quoteDecimal.toNumber(),
                marketId: poolState.marketId,
                marketProgramId: poolState.marketProgramId,
                marketVersion: 3,
                programId: poolAccountOwner,
                version,
            });
            if (lpMint.toBase58() != poolState.lpMint.toBase58()) {
                throw "Found some invalid keys";
            }
            // log({ version, baseMint: baseMint.toBase58(), quoteMint: quoteMint.toBase58(), lpMint: lpMint.toBase58(), marketId: marketId.toBase58(), marketProgramId: marketProgramId.toBase58() })
            let marketState = undefined;
            const marketAccountInfo = yield config_1.connection.getAccountInfo(marketId).catch((error) => null);
            if (!marketAccountInfo)
                throw "Market not found";
            try {
                marketState = raydium_sdk_1.Market.getLayouts(marketVersion).state.decode(marketAccountInfo.data);
                // if (mProgramIdStr != _SERUM_PROGRAM_ID_V3 && mProgramIdStr != _OPEN_BOOK_DEX_PROGRAM) {
                // }
            }
            catch (parseMeketDataError) {
                console.log({ parseMeketDataError });
            }
            if (!marketState)
                throw "MarketState not found";
            const { baseVault: marketBaseVault, quoteVault: marketQuoteVault, eventQueue: marketEventQueue, bids: marketBids, asks: marketAsks } = marketState;
            const res = {
                baseMint,
                quoteMint,
                quoteDecimals,
                baseDecimals,
                authority,
                baseVault,
                quoteVault,
                id,
                lookupTableAccount,
                lpDecimals,
                lpMint,
                lpVault,
                marketAuthority,
                marketId,
                marketProgramId,
                marketVersion,
                openOrders,
                programId,
                targetOrders,
                version,
                withdrawQueue,
                marketAsks,
                marketBids,
                marketBaseVault,
                marketQuoteVault,
                marketEventQueue,
            };
            this.cachedPoolKeys.set(poolId.toBase58(), res);
            // log({ poolKeys: res })
            return res;
        });
    }
    buyFromPool(input) {
        return __awaiter(this, void 0, void 0, function* () {
            this.reInit();
            const updateCPIx = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 });
            const updateCLIx = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 });
            const { amountIn, amountOut, poolKeys, user, fixedSide, tokenAccountIn, tokenAccountOut, feePayer } = input;
            this.cacheIxs.push(updateCPIx, updateCLIx);
            const inToken = amountIn.token.mint;
            const createInAtaInx = (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(user, tokenAccountIn, user, amountIn.token.mint);
            const createOutAtaInx = (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(user, tokenAccountOut, user, amountOut.token.mint);
            this.cacheIxs.push(createInAtaInx, createOutAtaInx);
            if (inToken.toBase58() == spl_token_1.NATIVE_MINT.toBase58()) {
                let lamports = BigInt(amountIn.raw.toNumber());
                const sendSolIx = web3_js_1.SystemProgram.transfer({
                    fromPubkey: user,
                    toPubkey: tokenAccountIn,
                    lamports,
                });
                this.cacheIxs.push(sendSolIx);
                const syncWSolAta = (0, spl_token_1.createSyncNativeInstruction)(tokenAccountIn, spl_token_1.TOKEN_PROGRAM_ID);
                this.cacheIxs.push(syncWSolAta);
            }
            // -------------------
            console.log("buyfrompool", amountOut.raw.toNumber() / Math.pow(10, amountOut.token.decimals), amountIn.raw.toNumber() / Math.pow(10, amountIn.token.decimals));
            let rayIxs = raydium_sdk_1.Liquidity.makeSwapInstruction({
                poolKeys,
                amountIn: amountIn.raw,
                amountOut: amountOut.raw,
                fixedSide,
                userKeys: { owner: user, tokenAccountIn, tokenAccountOut },
            }).innerTransaction;
            if (inToken.toBase58() != spl_token_1.NATIVE_MINT.toBase58()) {
                const unwrapSol = (0, spl_token_1.createCloseAccountInstruction)(tokenAccountOut, user, user);
                rayIxs.instructions.push(unwrapSol);
            }
            return {
                ixs: [...this.cacheIxs, ...rayIxs.instructions],
                signers: [...rayIxs.signers],
                amount: amountOut.raw.toNumber() / Math.pow(10, amountOut.token.decimals),
            };
        });
    }
    computeBuyAmount(input, etc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { amount, buyToken, inputAmountType, poolKeys, user } = input;
            const slippage = (_a = input.slippage) !== null && _a !== void 0 ? _a : new raydium_sdk_1.Percent(1, 100);
            const base = poolKeys.baseMint;
            const baseMintDecimals = poolKeys.baseDecimals;
            const quote = poolKeys.quoteMint;
            const quoteMintDecimals = poolKeys.quoteDecimals;
            const baseTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(base, user);
            const quoteTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(quote, user);
            const baseR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, base, baseMintDecimals);
            const quoteR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, quote, quoteMintDecimals);
            let amountIn;
            let amountOut;
            let tokenAccountIn;
            let tokenAccountOut;
            const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = yield config_1.connection
                .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new web3_js_1.PublicKey(e)))
                .catch(() => [null, null, null, null]);
            if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo)
                throw "Failed to fetch some data";
            // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
            // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
            // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))
            const lpSupply = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.MintLayout.decode(lpAccountInfo.data).supply, 8)).addn((_b = etc === null || etc === void 0 ? void 0 : etc.extraLpSupply) !== null && _b !== void 0 ? _b : 0);
            const baseReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn((_c = etc === null || etc === void 0 ? void 0 : etc.extraBaseResever) !== null && _c !== void 0 ? _c : 0);
            const quoteReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn((_d = etc === null || etc === void 0 ? void 0 : etc.extraQuoteReserve) !== null && _d !== void 0 ? _d : 0);
            let fixedSide;
            const poolInfo = {
                baseDecimals: poolKeys.baseDecimals,
                quoteDecimals: poolKeys.quoteDecimals,
                lpDecimals: poolKeys.lpDecimals,
                lpSupply,
                baseReserve,
                quoteReserve,
                startTime: null,
                status: null,
            };
            if (inputAmountType == "send") {
                fixedSide = "out"; //buy************************ */
                if (buyToken == "base") {
                    amountIn = new raydium_sdk_1.TokenAmount(quoteR, amount.toString(), false);
                    // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).amountOut
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
                else {
                    amountIn = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).amountOut
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
            }
            else {
                fixedSide = "in"; //sell************************ */
                if (buyToken == "base") {
                    amountOut = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).amountIn
                    amountIn = raydium_sdk_1.Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).maxAmountIn;
                }
                else {
                    amountIn = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).amountIn
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
            }
            if (buyToken == "base") {
                tokenAccountOut = baseTokenAccount;
                tokenAccountIn = quoteTokenAccount;
            }
            else {
                tokenAccountOut = quoteTokenAccount;
                tokenAccountIn = baseTokenAccount;
            }
            return {
                amountIn,
                amountOut,
                tokenAccountIn,
                tokenAccountOut,
                fixedSide,
            };
        });
    }
    computeSellAmount(input, etc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { amount, buyToken, inputAmountType, poolKeys, user } = input;
            const slippage = (_a = input.slippage) !== null && _a !== void 0 ? _a : new raydium_sdk_1.Percent(1, 100);
            const base = poolKeys.baseMint;
            const baseMintDecimals = poolKeys.baseDecimals;
            const quote = poolKeys.quoteMint;
            const quoteMintDecimals = poolKeys.quoteDecimals;
            const baseTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(base, user);
            const quoteTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(quote, user);
            const baseR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, base, baseMintDecimals);
            const quoteR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, quote, quoteMintDecimals);
            let amountIn;
            let amountOut;
            let tokenAccountIn;
            let tokenAccountOut;
            const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = yield config_1.connection
                .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new web3_js_1.PublicKey(e)))
                .catch(() => [null, null, null, null]);
            if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo)
                throw "Failed to fetch some data";
            // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
            // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
            // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))
            const lpSupply = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.MintLayout.decode(lpAccountInfo.data).supply, 8)).addn((_b = etc === null || etc === void 0 ? void 0 : etc.extraLpSupply) !== null && _b !== void 0 ? _b : 0);
            const baseReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn((_c = etc === null || etc === void 0 ? void 0 : etc.extraBaseResever) !== null && _c !== void 0 ? _c : 0);
            const quoteReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn((_d = etc === null || etc === void 0 ? void 0 : etc.extraQuoteReserve) !== null && _d !== void 0 ? _d : 0);
            let fixedSide;
            const poolInfo = {
                baseDecimals: poolKeys.baseDecimals,
                quoteDecimals: poolKeys.quoteDecimals,
                lpDecimals: poolKeys.lpDecimals,
                lpSupply,
                baseReserve,
                quoteReserve,
                startTime: null,
                status: null,
            };
            if (inputAmountType == "send") {
                fixedSide = "in";
                if (buyToken == "base") {
                    amountIn = new raydium_sdk_1.TokenAmount(quoteR, amount.toString(), false);
                    // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).amountOut
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
                else {
                    amountIn = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    // amountOut = Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).amountOut
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
            }
            else {
                fixedSide = "out";
                if (buyToken == "base") {
                    amountOut = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).amountIn
                    amountIn = raydium_sdk_1.Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).maxAmountIn;
                }
                else {
                    amountOut = new raydium_sdk_1.TokenAmount(quoteR, amount.toString(), false);
                    // amountIn = Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).amountIn
                    amountIn = raydium_sdk_1.Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).maxAmountIn;
                }
            }
            if (buyToken == "base") {
                tokenAccountOut = baseTokenAccount;
                tokenAccountIn = quoteTokenAccount;
            }
            else {
                tokenAccountOut = quoteTokenAccount;
                tokenAccountIn = baseTokenAccount;
            }
            return {
                amountIn,
                amountOut,
                tokenAccountIn,
                tokenAccountOut,
                fixedSide,
            };
        });
    }
    computeAmount(input, etc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { amount, poolKeys, user } = input;
            const slippage = (_a = input.slippage) !== null && _a !== void 0 ? _a : new raydium_sdk_1.Percent(1, 100);
            const base = poolKeys.baseMint;
            const baseMintDecimals = poolKeys.baseDecimals;
            const quote = poolKeys.quoteMint;
            const quoteMintDecimals = poolKeys.quoteDecimals;
            const baseTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(base, user);
            const quoteTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(quote, user);
            const baseR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, base, baseMintDecimals);
            const quoteR = new raydium_sdk_1.Token(spl_token_1.TOKEN_PROGRAM_ID, quote, quoteMintDecimals);
            let amountIn;
            let amountOut;
            let tokenAccountIn;
            let tokenAccountOut;
            const [lpAccountInfo, baseVAccountInfo, quoteVAccountInfo] = yield config_1.connection
                .getMultipleAccountsInfo([poolKeys.lpMint, poolKeys.baseVault, poolKeys.quoteVault].map((e) => new web3_js_1.PublicKey(e)))
                .catch(() => [null, null, null, null]);
            if (!lpAccountInfo || !baseVAccountInfo || !quoteVAccountInfo)
                throw "Failed to fetch some data";
            // const lpSupply = new BN(Number(MintLayout.decode(lpAccountInfo.data).supply.toString()))
            // const baseReserve = new BN(Number(AccountLayout.decode(baseVAccountInfo.data).amount.toString()))
            // const quoteReserve = new BN(Number(AccountLayout.decode(quoteVAccountInfo.data).amount.toString()))
            const lpSupply = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.MintLayout.decode(lpAccountInfo.data).supply, 8)).addn((_b = etc === null || etc === void 0 ? void 0 : etc.extraLpSupply) !== null && _b !== void 0 ? _b : 0);
            const baseReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(baseVAccountInfo.data).amount, 8)).addn((_c = etc === null || etc === void 0 ? void 0 : etc.extraBaseResever) !== null && _c !== void 0 ? _c : 0);
            const quoteReserve = new anchor_1.BN((0, bigint_buffer_1.toBufferBE)(spl_token_1.AccountLayout.decode(quoteVAccountInfo.data).amount, 8)).addn((_d = etc === null || etc === void 0 ? void 0 : etc.extraQuoteReserve) !== null && _d !== void 0 ? _d : 0);
            let fixedSide;
            const poolInfo = {
                baseDecimals: poolKeys.baseDecimals,
                quoteDecimals: poolKeys.quoteDecimals,
                lpDecimals: poolKeys.lpDecimals,
                lpSupply,
                baseReserve,
                quoteReserve,
                startTime: null,
                status: null,
            };
            if (input.type == "buy") {
                // base in quote out
                if (input.amountSide == "in") {
                    amountIn = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: quoteR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
                else {
                    amountOut = new raydium_sdk_1.TokenAmount(quoteR, amount.toString(), false);
                    amountIn = raydium_sdk_1.Liquidity.computeAmountIn({ amountOut, currencyIn: baseR, poolInfo, poolKeys, slippage }).maxAmountIn;
                }
            }
            else {
                // base out; quote in
                if (input.amountSide == "in") {
                    amountIn = new raydium_sdk_1.TokenAmount(quoteR, amount.toString(), false);
                    amountOut = raydium_sdk_1.Liquidity.computeAmountOut({ amountIn, currencyOut: baseR, poolInfo, poolKeys, slippage }).minAmountOut;
                }
                else {
                    amountOut = new raydium_sdk_1.TokenAmount(baseR, amount.toString(), false);
                    amountIn = raydium_sdk_1.Liquidity.computeAmountIn({ amountOut, currencyIn: quoteR, poolInfo, poolKeys, slippage }).maxAmountIn;
                }
            }
            if (input.type == "buy") {
                tokenAccountIn = baseTokenAccount;
                tokenAccountOut = quoteTokenAccount;
            }
            else {
                tokenAccountIn = quoteTokenAccount;
                tokenAccountOut = baseTokenAccount;
            }
            return {
                amountIn,
                amountOut,
                tokenAccountIn,
                tokenAccountOut,
            };
        });
    }
}
exports.BaseRay = BaseRay;
function formatAmmKeysById(connection, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("id", id);
            const account = yield connection.getAccountInfo(new web3_js_1.PublicKey(id));
            if (account === null) {
                console.log(" get id info error ");
                throw Error(" get id info error ");
            }
            const info = raydium_sdk_1.LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
            // console.log("info", info);
            const marketId = info.marketId;
            const marketAccount = yield connection.getAccountInfo(marketId);
            // console.log("marketAccount", marketAccount);
            if (marketAccount === null) {
                console.log(" get market info error");
                throw Error(" get market info error");
            }
            const marketInfo = raydium_sdk_1.MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);
            // console.log("marketInfo", marketInfo);
            // const lpMint = info.lpMint
            // const lpMintAccount = await connection.getAccountInfo(lpMint)
            // console.log('lpMintAccount', lpMintAccount)
            // if (lpMintAccount === null) {
            //     console.log(' get lp mint info error')
            //     throw Error(' get lp mint info error')
            // }
            // const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data)zs
            const data = {
                id,
                baseMint: info.baseMint.toString(),
                quoteMint: info.quoteMint.toString(),
                lpMint: info.lpMint.toString(),
                baseDecimals: info.baseDecimal.toNumber(),
                quoteDecimals: info.quoteDecimal.toNumber(),
                lpDecimals: 9,
                version: 4,
                programId: account.owner.toString(),
                authority: raydium_sdk_1.Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey.toString(),
                openOrders: info.openOrders.toString(),
                targetOrders: info.targetOrders.toString(),
                baseVault: info.baseVault.toString(),
                quoteVault: info.quoteVault.toString(),
                withdrawQueue: info.withdrawQueue.toString(),
                lpVault: info.lpVault.toString(),
                marketVersion: 3,
                marketProgramId: info.marketProgramId.toString(),
                marketId: info.marketId.toString(),
                marketAuthority: raydium_sdk_1.Market.getAssociatedAuthority({
                    programId: info.marketProgramId,
                    marketId: info.marketId,
                }).publicKey.toString(),
                marketBaseVault: marketInfo.baseVault.toString(),
                marketQuoteVault: marketInfo.quoteVault.toString(),
                marketBids: marketInfo.bids.toString(),
                marketAsks: marketInfo.asks.toString(),
                marketEventQueue: marketInfo.eventQueue.toString(),
                lookupTableAccount: web3_js_1.PublicKey.default.toString(),
            };
            // console.log("-------------------------------------", data);
            return data;
        }
        catch (e) {
            console.log("formatAmmKeysById", e);
        }
    });
}
const getPoolkeys = (connection, id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const targetPoolInfo = yield formatAmmKeysById(connection, id);
        // console.log("targetPoolInfo", targetPoolInfo);
        const poolKeys = (0, raydium_sdk_1.jsonInfo2PoolKeys)(targetPoolInfo);
        return poolKeys;
    }
    catch (e) {
        console.log("getPoolkeys", e);
        return null;
    }
});
exports.getPoolkeys = getPoolkeys;
function getRaydiumPoolsByTokenAddress(tokenAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenPublicKey = new web3_js_1.PublicKey(tokenAddress);
        const poolAddresses = [];
        // Fetch all accounts owned by the Raydium program
        const accounts = yield config_1.connection.getProgramAccounts(new web3_js_1.PublicKey(raydium_sdk_1._SERUM_PROGRAM_ID_V3), {
            filters: [
                {
                    dataSize: 165, // Only account data layouts for token accounts are 165 bytes
                },
            ],
        });
        for (const account of accounts) {
            const accountInfo = spl_token_1.AccountLayout.decode(account.account.data);
            // Check if this account contains the token
            if (accountInfo.mint.equals(tokenPublicKey)) {
                poolAddresses.push(account.pubkey);
            }
        }
        return poolAddresses;
    });
}
// Usage example
const tokenAddress = "YourTokenAddressHere"; // Replace with the token address you're interested in
getRaydiumPoolsByTokenAddress(tokenAddress).then((pools) => {
    console.log("Pools containing the token:", pools);
});
function swapRay(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (input.sellToken) {
            if (input.sellToken == "base") {
                input.buyToken = "quote";
            }
            else {
                input.buyToken = "base";
            }
        }
        const user = input.keypair.publicKey;
        const baseRay = new BaseRay();
        const slippage = input.slippage;
        const poolKeys = yield (0, exports.getPoolkeys)(config_1.connection, input.poolId.toBase58()).catch((getPoolKeysError) => {
            console.log({ getPoolKeysError });
            return null;
        });
        if (!poolKeys) {
            throw new Error("pool not found");
        }
        const { amount, amountSide, buyToken } = input;
        // console.log('tx handler swap input', amount, amountSide, buyToken)
        const swapAmountInfo = yield baseRay
            .computeBuyAmount({
            amount,
            buyToken,
            inputAmountType: amountSide,
            poolKeys,
            user,
            slippage,
        })
            .catch((computeBuyAmountError) => console.log({ computeBuyAmountError }));
        if (!swapAmountInfo)
            throw new Error("failed to calculate the amount");
        const { amountIn, amountOut, fixedSide, tokenAccountIn, tokenAccountOut } = swapAmountInfo;
        console.log(`swap ${amountIn.toFixed(4)} ${amountIn.token.mint} to ${amountOut.toFixed(4)} ${amountOut.token.mint}`);
        const feePayer = (_a = input === null || input === void 0 ? void 0 : input.feePayer) !== null && _a !== void 0 ? _a : input.keypair;
        console.log("feePayer", feePayer.publicKey.toBase58());
        const txInfo = yield baseRay
            .buyFromPool({ amountIn, amountOut, fixedSide, poolKeys, tokenAccountIn, tokenAccountOut, user, feePayer: feePayer.publicKey })
            .catch((buyFromPoolError) => {
            console.log({ buyFromPoolError });
            return null;
        });
        if (!txInfo)
            throw new Error("failed to prepare swap transaction");
        const recentBlockhash = (yield config_1.connection.getLatestBlockhash("finalized")).blockhash;
        const txMsg = new web3_js_2.TransactionMessage({
            instructions: txInfo.ixs,
            payerKey: (_c = (_b = input === null || input === void 0 ? void 0 : input.feePayer) === null || _b === void 0 ? void 0 : _b.publicKey) !== null && _c !== void 0 ? _c : user,
            recentBlockhash,
        }).compileToV0Message();
        const tx = new web3_js_2.VersionedTransaction(txMsg);
        tx.sign([feePayer, input.keypair, ...txInfo.signers]);
        {
            const buysimRes = yield config_1.connection.simulateTransaction(tx);
            // console.log('swap log', buysimRes.value.logs?.slice(-10))
        }
        return {
            tx,
            amountIn,
            amountOut,
        };
    });
}
function swapRaydium(input) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const user = input.keypair.publicKey;
        const baseRay = new BaseRay();
        const slippage = input.slippage;
        const poolKeys = yield (0, exports.getPoolkeys)(config_1.connection, input.poolId.toBase58()).catch((getPoolKeysError) => {
            console.log({ getPoolKeysError });
            return null;
        });
        if (!poolKeys) {
            throw new Error("pool not found");
        }
        console.log("base mint", poolKeys.baseMint.toBase58());
        console.log("quote mint", poolKeys.quoteMint.toBase58());
        // console.log('tx handler swap input', amount, amountSide, buyToken)
        const swapAmountInfo = yield baseRay
            .computeAmount({
            amount: input.amount,
            type: input.type,
            amountSide: input.amountSide,
            poolKeys,
            user,
            slippage,
        })
            .catch((computeBuyAmountError) => console.log({ computeBuyAmountError }));
        if (!swapAmountInfo)
            throw new Error("failed to calculate the amount");
        const { amountIn, amountOut, tokenAccountIn, tokenAccountOut } = swapAmountInfo;
        console.log(`swap ${amountIn.toFixed(4)} ${amountIn.token.mint} to ${amountOut.toFixed(4)} ${amountOut.token.mint}`);
        const feePayer = (_a = input === null || input === void 0 ? void 0 : input.feePayer) !== null && _a !== void 0 ? _a : input.keypair;
        console.log("feePayer", feePayer.publicKey.toBase58());
        const txInfo = yield baseRay
            .buyFromPool({ amountIn, amountOut, fixedSide: input.amountSide, poolKeys, tokenAccountIn, tokenAccountOut, user, feePayer: feePayer.publicKey })
            .catch((buyFromPoolError) => {
            console.log({ buyFromPoolError });
            return null;
        });
        if (!txInfo)
            throw new Error("failed to prepare swap transaction");
        const recentBlockhash = (yield config_1.connection.getLatestBlockhash("finalized")).blockhash;
        const txMsg = new web3_js_2.TransactionMessage({
            instructions: txInfo.ixs,
            payerKey: (_c = (_b = input === null || input === void 0 ? void 0 : input.feePayer) === null || _b === void 0 ? void 0 : _b.publicKey) !== null && _c !== void 0 ? _c : user,
            recentBlockhash,
        }).compileToV0Message();
        const tx = new web3_js_2.VersionedTransaction(txMsg);
        tx.sign([feePayer, input.keypair, ...txInfo.signers]);
        {
            const buysimRes = yield config_1.connection.simulateTransaction(tx);
            // console.log('swap log', buysimRes.value.logs?.slice(-10))
        }
        return {
            tx,
            amountIn,
            amountOut,
        };
    });
}
function fakeVolumneTransaction(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const puffPool = new web3_js_1.PublicKey("9Tb2ohu5P16BpBarqd3N27WnkF51Ukfs8Z1GzzLDxVZW");
        const swapAmount = args.swapAmount;
        const sellAmountPercentage = 0.98;
        const sellAmount = swapAmount * sellAmountPercentage;
        const randomSlippagePercentage = 0.1;
        const [buyAmount1, buyAmount2] = (0, calculationUtils_1.calculatePartionedSwapAmount)(swapAmount, 2, randomSlippagePercentage);
        const [buyRes, buyRes2, sellRes] = yield Promise.all([
            swapRay({
                amount: buyAmount1,
                amountSide: "receive",
                buyToken: "quote",
                keypair: args.wallet,
                feePayer: args.feePayer1,
                poolId: puffPool,
                slippage: new raydium_sdk_1.Percent(10, 100),
            }),
            swapRay({
                amount: buyAmount2,
                amountSide: "receive",
                buyToken: "quote",
                keypair: args.wallet,
                feePayer: args.feePayer2,
                poolId: puffPool,
                slippage: new raydium_sdk_1.Percent(10, 100),
            }),
            swapRay({
                amount: sellAmount,
                amountSide: "receive",
                buyToken: "base",
                keypair: args.wallet,
                feePayer: args.feePayer3,
                poolId: puffPool,
                slippage: new raydium_sdk_1.Percent(10, 100),
            }),
        ]);
        if (buyRes.tx && buyRes2.tx && sellRes.tx) {
            const res = yield (0, jitoUtils_1.sendAndConfirmJitoTransactions)({
                transactions: [buyRes.tx, buyRes2.tx, sellRes.tx],
                payer: args.feePayer1,
                signers: [args.wallet, args.feePayer1, args.feePayer2, args.feePayer3],
                instructions: [
                    web3_js_1.SystemProgram.transfer({
                        fromPubkey: args.feePayer1.publicKey,
                        toPubkey: args.feePayer1.publicKey,
                        lamports: 1000000,
                    }),
                ],
            });
        }
    });
}
