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
exports.getDevWallet = getDevWallet;
exports.fundTestWallet = fundTestWallet;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
function getDevWallet(nr = 1) {
    const pkStr = process.env[`DEV_WALLET_${nr}`];
    if (!pkStr)
        throw new Error(`DEV_WALLET_${nr} not found in env`);
    return web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(pkStr));
}
// OUTDATED
function fundTestWallet(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const testWallet = web3_js_1.Keypair.generate();
        //   console.log(`created test wallet: ${testWallet.publicKey.toBase58()}`);
        //   const devWallet = getDevWallet();
        // fund test wallet
        // await sendSol({ from: devWallet, to: testWallet.publicKey, amount: args.amount });
        return testWallet;
    });
}
