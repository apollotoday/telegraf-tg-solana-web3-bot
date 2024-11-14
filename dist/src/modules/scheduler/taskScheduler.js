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
exports.default = taskSchedulerInit;
const node_cron_1 = __importDefault(require("node-cron"));
const marketMakingJobHandler_1 = require("../marketMaking/marketMakingJobHandler");
// pm2 instance name
const processName = process.env.name || 'primary';
console.log('Pm2 instance name:', processName);
// Only schedule cron job if it´s the primary pm2 instance
if (processName === 'primary') {
    node_cron_1.default.schedule('15 * * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Cron: every 15 seconds');
        yield (0, marketMakingJobHandler_1.handleOpenMarketMakingJobs)();
    }));
}
function taskSchedulerInit() {
    console.log('Initializing task scheduler');
}
