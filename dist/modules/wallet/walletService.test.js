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
const client_1 = require("@prisma/client");
const walletService_1 = require("./walletService");
const botCustomer_1 = require("../customer/botCustomer");
const bookedService_1 = require("../customer/bookedService");
test("createVolumneBot", () => __awaiter(void 0, void 0, void 0, function* () {
    const customer = yield (0, botCustomer_1.createBotCustomer)({
        telegramUsername: "telegramUsername",
        email: "testUserEmail",
    });
    yield (0, walletService_1.createVolumeBot)({ customerId: customer.id, usedSplTokenMint: 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB' });
}));
test("createBotCustomer", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, botCustomer_1.createBotCustomer)({
        email: "test@test.com",
        telegramUsername: "telegramUsername",
    });
}));
test("createAndStoreBotCustomerWallets", () => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield (0, botCustomer_1.createBotCustomer)({
        email: "test@test.com",
        telegramUsername: "telegramUsername",
    });
    const bookedServiceRes = yield (0, bookedService_1.createBookedServiceAndWallet)({
        botCustomerId: res.id,
        serviceType: client_1.EServiceType.RANKING,
        solAmount: 1,
        usedSplTokenMint: 'G9tt98aYSznRk7jWsfuz9FnTdokxS6Brohdo9hSmjTRB'
    });
    yield (0, walletService_1.createAndStoreBotCustomerWallets)({
        customerId: res.id,
        subWalletCount: 5,
        walletType: client_1.EWalletType.SERVICE_FUNDING,
    });
}));
