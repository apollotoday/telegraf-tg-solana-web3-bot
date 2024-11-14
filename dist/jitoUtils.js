"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.sendAndConfirmJitoTransactions = void 0;
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importStar(require("axios"));
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("./config");
const sendAndConfirmJitoTransactions = (_a) => __awaiter(void 0, [_a], void 0, function* ({ transactions, payer, signers, instructions, }) {
    console.log("Starting Jito transaction execution...");
    const tipAccounts = [
        "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
        "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
        "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
        "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
        "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
        "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
        "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
        "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
    ];
    const jitoFeeWallet = new web3_js_1.PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())]);
    console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);
    try {
        console.log(`Calculated fee: ${config_1.jitoFee / web3_js_1.LAMPORTS_PER_SOL} sol`);
        let latestBlockhash = yield config_1.connection.getLatestBlockhash();
        const jitTipTxFeeMessage = new web3_js_1.TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [
                web3_js_1.SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: jitoFeeWallet,
                    lamports: config_1.jitoFee,
                }),
                ...(instructions !== null && instructions !== void 0 ? instructions : []),
            ],
        }).compileToV0Message();
        const jitoFeeTx = new web3_js_1.VersionedTransaction(jitTipTxFeeMessage);
        jitoFeeTx.sign([payer, ...(signers !== null && signers !== void 0 ? signers : [])]);
        const jitoTxsignature = bs58_1.default.encode(jitoFeeTx.signatures[0]);
        // Serialize the transactions once here
        const serializedjitoFeeTx = bs58_1.default.encode(jitoFeeTx.serialize());
        const serializedTransactions = [serializedjitoFeeTx];
        for (let i = 0; i < transactions.length; i++) {
            const serializedTransaction = bs58_1.default.encode(transactions[i].serialize());
            serializedTransactions.push(serializedTransaction);
        }
        const endpoints = [
            // "https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles",
            // "https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles",
            'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
            // "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles",
            // 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
        ];
        const requests = endpoints.map((url) => axios_1.default.post(url, {
            jsonrpc: "2.0",
            id: 1,
            method: "sendBundle",
            params: [serializedTransactions],
        }));
        console.log("Sending transactions to endpoints...");
        const results = yield Promise.all(requests.map((p) => p.catch((e) => e)));
        console.log("jito bundle tx", results[0].data.result);
        const signatures = transactions.map((tx) => {
            if (tx instanceof web3_js_1.VersionedTransaction) {
                return bs58_1.default.encode(tx.signatures[0]);
            }
            else {
                return bs58_1.default.encode(tx.signatures[0].signature);
            }
        });
        console.log("jito results", signatures);
        const successfulResults = results.filter((result) => !(result instanceof Error));
        if (successfulResults.length > 0) {
            console.log(`Successful response`);
            const confirmation = yield config_1.connection.confirmTransaction({
                signature: jitoTxsignature,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                blockhash: latestBlockhash.blockhash,
            }, "confirmed");
            console.log(confirmation);
            return { confirmed: !confirmation.value.err, jitoTxsignature };
        }
        else {
            console.log(`No successful responses received for jito`);
        }
        return { confirmed: false };
    }
    catch (error) {
        if (error instanceof axios_1.AxiosError) {
            console.log("Failed to execute jito transaction");
        }
        console.log("Error during transaction execution", error);
        return { confirmed: false };
    }
});
exports.sendAndConfirmJitoTransactions = sendAndConfirmJitoTransactions;
