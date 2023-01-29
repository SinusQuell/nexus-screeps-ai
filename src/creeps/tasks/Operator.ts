import { TaskMineMemory, TaskType } from "./Task"


export class Operator {

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
                taskType: TaskType.MINE,
                taskPosition: minerSpots[i].position,
                requiredParts: {
                    work: 6,
                    move: 1,
                }
            }
        }
    }
}
