import taskSchedulerInit from './modules/scheduler/taskScheduler';
import { startMomentumAIBot } from './modules/telegramBot/telegramBotSetup';
import { overwriteConsoleLog } from './modules/utils/changeConsoleLogWithTimestamp';

overwriteConsoleLog()
taskSchedulerInit()
export const telegrafMomentumAIBot = startMomentumAIBot()