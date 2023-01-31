import { TaskMineMemory, TaskType } from "./tasks/Task"
import { v4 as uuid } from 'uuid';
import { createTask } from "./tasks/TaskMapper";

export class Operator {

    public static operateCreeps() {
        for(let name in Game.creeps) {
            let creep = Game.creeps[name];
            try {
                if (creep.memory.task) {
                    let task = createTask(creep.memory.task?.taskType)
                    task.run(creep);
                }
            } catch (error: any) {
                console.error(error.stack);
            }
        }
    }

    public static updateColonyTasks(room: Room) {
        this.updateMiningTasks(room)
    }

    static updateMiningTasks(room: Room) {
        // look for existing tasks
        let minerSpots = Memory.colonies[room.name].minerSpots
        let mineTasks = Memory.colonies[room.name].tasks.filter(x => x.taskType == TaskType.MINE) as TaskMineMemory[]
        if (mineTasks.length == minerSpots.length) return

        // loop through minerSpots and create mining tasks if nessessary
        for (let i = 0; i < minerSpots.length; i++) {
            // look for existing task for this spot
            if (mineTasks.find(x => x.sourceIndex == minerSpots[i].sourceIndex)) continue

            //didn't find a task for this spot! create one
            Memory.colonies[room.name].tasks[Memory.colonies[room.name].tasks.length] = {
                id: uuid(),
                taskType: TaskType.MINE,
                taskPosition: minerSpots[i].position,
                sourceIndex: minerSpots[i].sourceIndex,
                requiredParts: {
                    work: 6,
                    move: 1,
                }
            } as TaskMineMemory
        }
    }
}
