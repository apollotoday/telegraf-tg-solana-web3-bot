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
exports.getSimulationComputeUnits = void 0;
exports.increaseComputePriceInstruction = increaseComputePriceInstruction;
exports.increaseComputeUnitInstruction = increaseComputeUnitInstruction;
exports.createTransactionForInstructions = createTransactionForInstructions;
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../../config");
const web3ErrorLogs_1 = require("./web3ErrorLogs");
function increaseComputePriceInstruction(microLamports) {
    return web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: microLamports !== null && microLamports !== void 0 ? microLamports : 30001,
    });
}
function increaseComputeUnitInstruction(units) {
    return web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
        units: units !== null && units !== void 0 ? units : 300000,
    });
}
const getSimulationComputeUnits = (connection, instructions, payer) => __awaiter(void 0, void 0, void 0, function* () {
    const testInstructions = [
        // Set an arbitrarily high number in simulation
        // so we can be sure the transaction will succeed
        // and get the real compute units used
        web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
        web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100001 }),
        ...instructions,
    ];
    const testTransaction = new web3_js_1.VersionedTransaction(new web3_js_1.TransactionMessage({
        instructions: testInstructions,
        payerKey: payer,
        // RecentBlockhash can by any public key during simulation
        // since 'replaceRecentBlockhash' is set to 'true' below
        recentBlockhash: web3_js_1.PublicKey.default.toString(),
    }).compileToV0Message());
    const rpcResponse = yield connection.simulateTransaction(testTransaction, {
        replaceRecentBlockhash: true,
        sigVerify: false,
    });
    (0, web3ErrorLogs_1.getErrorFromRPCResponse)(rpcResponse);
    return rpcResponse.value.unitsConsumed || null;
});
exports.getSimulationComputeUnits = getSimulationComputeUnits;
function createTransactionForInstructions(_a) {
    return __awaiter(this, arguments, void 0, function* ({ instructions, signers, wallet, }) {
        const blockhash = yield config_1.connection.getLatestBlockhash({
            commitment: 'confirmed',
        });
        console.log(`blockhash`, blockhash);
        const unitsConsumed = yield (0, exports.getSimulationComputeUnits)(config_1.connection, instructions, new web3_js_1.PublicKey(wallet));
        const transaction = new web3_js_1.Transaction(Object.assign({ feePayer: new web3_js_1.PublicKey(wallet) }, blockhash)).add(increaseComputePriceInstruction(), increaseComputeUnitInstruction(!!unitsConsumed ? unitsConsumed + 1000 : undefined), ...instructions);
        if (signers.length > 0) {
            console.log(`Partial signing with `, signers.map((s) => s.publicKey.toBase58()));
            yield transaction.partialSign(...signers);
        }
        console.log('Debug log for Solana transaction:', `Wallet: ${wallet}`, `Instructions count: ${transaction.instructions.length}`);
        return { transaction, unitsConsumed, blockhash };
    });
}
