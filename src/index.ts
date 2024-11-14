import taskSchedulerInit from './modules/scheduler/taskScheduler';
import { overwriteConsoleLog } from './modules/utils/changeConsoleLogWithTimestamp';

overwriteConsoleLog()
taskSchedulerInit()