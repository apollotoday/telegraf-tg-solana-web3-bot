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
exports.createBookedServiceAndWallet = createBookedServiceAndWallet;
const client_1 = require("@prisma/client");
const walletUtils_1 = require("../wallet/walletUtils");
const prisma_1 = __importDefault(require("../../lib/prisma"));
function createBookedServiceAndWallet(_a) {
    return __awaiter(this, arguments, void 0, function* ({ botCustomerId, solAmount, serviceType, usedSplTokenMint, }) {
        const newWallet = (0, walletUtils_1.generateAndEncryptWallet)();
        return yield prisma_1.default.bookedService.create({
            data: {
                type: serviceType,
                solAmountForService: solAmount,
                botCustomer: {
                    connect: {
                        id: botCustomerId,
                    },
                },
                usedSplToken: {
                    connect: {
                        tokenMint: usedSplTokenMint,
                    },
                },
                mainWallet: {
                    create: {
                        encryptedPrivKey: newWallet.encryptedPrivKey,
                        pubkey: newWallet.pubkey,
                        type: client_1.EWalletType.SERVICE_FUNDING,
                        botCustomerId,
                    },
                },
            },
            include: {
                mainWallet: true,
            },
        });
    });
}
