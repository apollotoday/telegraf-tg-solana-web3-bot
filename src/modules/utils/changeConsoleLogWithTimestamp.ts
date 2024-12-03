export function overwriteConsoleLog() {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(`[${new Date().toISOString()}]`, ...args);
  };
}