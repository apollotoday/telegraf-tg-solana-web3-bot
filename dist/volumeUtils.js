"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomAmount = void 0;
const randomAmount = (max, min, bal) => {
    const amount = ((max > bal ? bal : max) - min) * Math.random() + min;
    return amount;
};
exports.randomAmount = randomAmount;
