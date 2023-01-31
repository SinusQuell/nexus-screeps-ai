import { Task, TaskType } from "./Task";
import { TaskBuild } from "./TaskBuild";
import { TaskFill } from "./TaskFill";
import { TaskMine } from "./TaskMine";
import { TaskTransport } from "./TaskTransport";
import { TaskUpgrade } from "./TaskUpgrade";

const TypeMapping = {
    [TaskType.MINE]: TaskMine,
    [TaskType.UPGRADE]: TaskUpgrade,
    [TaskType.BUILD]: TaskBuild,
    [TaskType.TRANSPORT]: TaskTransport,
    [TaskType.FILL]: TaskFill
}

export function createTask(taskType: TaskType): Task {
    return new TypeMapping[taskType]();
}
