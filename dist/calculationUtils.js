"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomAmount = void 0;
exports.calculatePartionedSwapAmount = calculatePartionedSwapAmount;
exports.getRandomInt = getRandomInt;
exports.getRandomFloat = getRandomFloat;
const lodash_1 = __importDefault(require("lodash"));
function calculatePartionedSwapAmount(totalSwapAmount, partCount, randomSlippagePercentage) {
    let partAmounts = [];
    const averagePartAmount = totalSwapAmount / partCount;
    for (let i = 0; i < partCount - 1; i++) {
        const randomSlippage = averagePartAmount * randomSlippagePercentage;
        const partAmount = lodash_1.default.random(averagePartAmount - randomSlippage, averagePartAmount + randomSlippage);
        partAmounts.push(partAmount);
    }
    const totalPartAmount = lodash_1.default.sum(partAmounts);
    const lastPartAmount = totalSwapAmount - totalPartAmount;
    partAmounts.push(lastPartAmount);
    return partAmounts;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
const randomAmount = (max, min, bal) => {
    const maxAmount = max > bal ? bal : max;
    return getRandomFloat(min, maxAmount);
};
exports.randomAmount = randomAmount;
