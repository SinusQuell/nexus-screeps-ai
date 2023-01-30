import { TaskMineMemory, TaskType } from "../creeps/tasks/Task"
import { TaskMine } from "../creeps/tasks/TaskMine"
import { createBody, getCostByParts } from "./SpawningUtils"

export class Progenitor {

    public static spawnCreeps(room: Room) {
        this.checkMineTasks(room)
    }

    public static checkMineTasks(room: Room) {
        let mineTasks = Memory.colonies[room.name].tasks.filter(t => t.taskType == TaskType.MINE) as TaskMineMemory[]
        if (!mineTasks.length) return;

        mineTasks.forEach(t => {
            let creepCost = getCostByParts(t.requiredParts)

            // if creepCost is smaller than room.energyCapacityAvailable (so we can spawn the whole creep),
            // then creepAmount will be 1. Otherwise, it will be larger.
            let creepAmount = Math.ceil(creepCost / room.energyCapacityAvailable)

            // look for creeps already doing this task
            let creeps = _.filter(Game.creeps, c => c.memory.task.id == t.id)
            if (creeps.length >= creepAmount) return

            // spawn missing creeps
            let body = createBody(room.energyCapacityAvailable, t.requiredParts)
            for (let i = 0; i < creepAmount-creeps.length; i++) {
                // find free spawn in the room
                // spawn missing creeps
            }

        });
    }


}
