import { TaskMineMemory, TaskType } from "../creeps/tasks/Task"
import { TaskMine } from "../creeps/tasks/TaskMine"
import { createBody, getCostByParts, getCostByPartsArray } from "./SpawningUtils"
import { SourceHelper } from "../utils/SourceHelper";
import { clone } from "lodash";

export class Progenitor {

    public static spawnCreeps(room: Room) {
        this.checkMineTasks(room)
    }

    public static checkMineTasks(room: Room) {
        let mineTasks = Memory.colonies[room.name].tasks.filter(t => t.taskType == TaskType.MINE) as TaskMineMemory[]
        if (!mineTasks.length) return;

        mineTasks.forEach(t => {
            t = clone(t)
            let creepCostFull = getCostByParts(t.requiredParts)

            // if creepCost is smaller than room.energyCapacityAvailable (so we can spawn the whole creep),
            // then creepAmount will be 1. Otherwise, it will be larger.
            let creepAmount = Math.ceil(creepCostFull / room.energyCapacityAvailable)
            console.log(creepAmount)

            // look for creeps already doing this task
            let creeps = _.filter(Game.creeps, c => c.memory.task?.id == t.id && c.memory.homeRoomName == room.name)
            if (creeps.length >= creepAmount) return

            // create fitting body
            let body = createBody(room.energyCapacityAvailable, t.requiredParts)
            let creepCostFinal = getCostByPartsArray(body)

            //get source info
            let source = room.find(FIND_SOURCES)[t.sourceIndex!]
            let spaces = SourceHelper.getSourceSpaceAmount(source)

            // adjust creep amount if source is low on space
            if (spaces < creepAmount) creepAmount = spaces

            // spawn missing creeps
            for (let i = 0; i < creepAmount-creeps.length; i++) {
                // adjust task so first creep always goes to the taskPosition, others just path there
                if (creepAmount > 1 && i == 0) t.useTaskPosition = true
                else t.useTaskPosition = false

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
