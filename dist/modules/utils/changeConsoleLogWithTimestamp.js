"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overwriteConsoleLog = overwriteConsoleLog;
function overwriteConsoleLog() {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        originalConsoleLog(`[${new Date().toISOString()}]`, ...args);
    };
}
