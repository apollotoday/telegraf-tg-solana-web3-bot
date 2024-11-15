"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundsToSendForRanking = exports.meteoraDynPool = exports.tokenAddr = exports.solTokenMint = exports.solAddr = exports.jitoFee = exports.connection = exports.net = exports.devRpc = exports.mainRpc = exports.BotToken = void 0;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
exports.BotToken = process.env.BOT_TOKEN;
exports.mainRpc = process.env.SOLANA_RPC;
exports.devRpc = process.env.SOLANA_DEV_RPC;
exports.net = process.env.NET;
exports.connection = new web3_js_1.Connection(exports.net == "mainnet-beta" ? exports.mainRpc : exports.devRpc);
exports.jitoFee = 500000; // 47000
exports.solAddr = "So11111111111111111111111111111111111111112";
exports.solTokenMint = "So11111111111111111111111111111111111111112";
exports.tokenAddr = "14h6AkD5uSNzprMKm4yoQuQTymuYVMmmWo8EADEtTNUT";
exports.meteoraDynPool = "2huFuBQSA7a1Gree6USKLREYzmJ79YMnMgzYkpwtoC29";
exports.fundsToSendForRanking = 0.0031;
