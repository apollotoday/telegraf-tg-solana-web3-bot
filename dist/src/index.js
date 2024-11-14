"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const taskScheduler_1 = __importDefault(require("./modules/scheduler/taskScheduler"));
const changeConsoleLogWithTimestamp_1 = require("./modules/utils/changeConsoleLogWithTimestamp");
(0, changeConsoleLogWithTimestamp_1.overwriteConsoleLog)();
(0, taskScheduler_1.default)();
