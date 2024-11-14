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
exports.handleOpenMarketMakingJobs = handleOpenMarketMakingJobs;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const buyMarketMakingHandler_1 = require("./buyMarketMakingHandler");
const sellMarketMakingHandler_1 = require("./sellMarketMakingHandler");
function handleOpenMarketMakingJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Handling open market making jobs');
        const buyMarketMakingJobs = yield prisma_1.default.marketMakingJob.findMany({
            where: {
                earliestExecutionTimestampForBuy: {
                    lte: new Date(),
                    not: null,
                },
                buyStatus: client_1.EJobStatus.OPEN,
            },
            include: {
                cycle: {
                    include: {
                        bookedService: true,
                    }
                },
            }
        });
        const sellMarketMakingJobs = yield prisma_1.default.marketMakingJob.findMany({
            where: {
                earliestExecutionTimestampForSell: {
                    lte: new Date(),
                    not: null,
                },
                sellStatus: client_1.EJobStatus.OPEN,
            },
            include: {
                cycle: {
                    include: {
                        bookedService: true,
                    }
                },
            }
        });
        console.log(`Found ${buyMarketMakingJobs.length} buy jobs and ${sellMarketMakingJobs.length} sell jobs`);
        yield Promise.all([
            buyMarketMakingJobs.map((job) => __awaiter(this, void 0, void 0, function* () {
                yield (0, buyMarketMakingHandler_1.handleBuyMarketMakingJob)(job);
            })),
            sellMarketMakingJobs.map((job) => __awaiter(this, void 0, void 0, function* () {
                yield (0, sellMarketMakingHandler_1.handleSellMarketMakingJob)(job);
            })),
        ]);
    });
}
