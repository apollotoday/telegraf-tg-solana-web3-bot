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
const web3_js_1 = require("@solana/web3.js");
const solUtils_1 = require("./solUtils");
const testUtils_1 = require("./testUtils");
const utils_1 = require("./utils");
const config_1 = require("./config");
test("close wallet", () => __awaiter(void 0, void 0, void 0, function* () {
    const devWallet = (0, testUtils_1.getDevWallet)();
    const testWallet = web3_js_1.Keypair.generate();
    console.log("generated test wallet", testWallet.publicKey.toBase58());
    yield (0, solUtils_1.sendSol)({ from: devWallet, to: testWallet.publicKey, amount: solUtils_1.Sol.fromSol(0.001) });
    while (true) {
        const balance = yield config_1.connection.getBalance(testWallet.publicKey);
        if (balance > 0) {
            console.log("balance received", balance);
            break;
        }
        (0, utils_1.sleep)(1000);
    }
    yield (0, solUtils_1.closeWallet)({ from: testWallet, to: devWallet });
}));
