import { TaskMineMemory, TaskType } from "../creeps/tasks/Task"
import { TaskMine } from "../creeps/tasks/TaskMine"
import { createBody, getCostByParts, getCostByPartsArray } from "./SpawningUtils"

export class Progenitor {

    public static spawnCreeps(room: Room) {
        this.checkMineTasks(room)
    }

    public static checkMineTasks(room: Room) {
        let mineTasks = Memory.colonies[room.name].tasks.filter(t => t.taskType == TaskType.MINE) as TaskMineMemory[]
        if (!mineTasks.length) return;

        mineTasks.forEach(t => {
            let creepCostFull = getCostByParts(t.requiredParts)

            // if creepCost is smaller than room.energyCapacityAvailable (so we can spawn the whole creep),
            // then creepAmount will be 1. Otherwise, it will be larger.
            let creepAmount = Math.ceil(creepCostFull / room.energyCapacityAvailable)

            // look for creeps already doing this task
            let creeps = _.filter(Game.creeps, c => c.memory.task?.id == t.id && c.memory.homeRoomName == room.name)
            if (creeps.length >= creepAmount) return

            // create fitting body
            let body = createBody(room.energyCapacityAvailable, t.requiredParts)
            let creepCostFinal = getCostByPartsArray(body)

            // TODO: adjust taskPosition when splitting Task to multiple creeps.

            // spawn missing creeps
            for (let i = 0; i < creepAmount-creeps.length; i++) {
                let spawn = this.findFreeSpawn(room)
                if (spawn && room.energyAvailable >= creepCostFinal) {
                    spawn.spawnCreep(body, `${t.taskType}${new Date().getTime()}`, { memory: { homeRoomName: room.name, task: t,}})
                }
            }
        });
    }

    private static findFreeSpawn(room: Room): StructureSpawn | false {
        let spawns = room.find(FIND_MY_SPAWNS, {
            filter: (structure) => {
                return (structure.spawning == null);
            }
        });
        if (spawns.length > 0)
            return spawns[0];

        return false
    }
}
