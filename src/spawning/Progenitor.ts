import { TaskMemory, TaskMineMemory, TaskTransportMemory, TaskType } from "../creeps/tasks/Task"
import { createBody, getCostByParts, getCostByPartsArray } from "./SpawningUtils"
import { SourceHelper } from "../utils/SourceHelper";
import { clone } from "lodash";

export class Progenitor {

    public static spawnCreeps(room: Room) {
        // TODO: spawn a filler first.
        this.checkMineTasks(room)
        // TODO: spawn Transporters
    }

    public static checkMineTasks(room: Room) {
        let mineTasks = Memory.colonies[room.name].tasks.filter(t => t.taskType == TaskType.MINE) as TaskMineMemory[]
        if (!mineTasks.length) return;

        mineTasks.forEach(t => {
            t = clone(t)

            // get creep data (body, cost, existing creeps, etc.)
            let creepData = this.getCreepData(room, t)
            if (!creepData) return

            //get source info
            let source = room.find(FIND_SOURCES)[t.sourceIndex!]
            let spaces = SourceHelper.getSourceSpaceAmount(source)

            // adjust creep amount if source is low on space
            if (spaces < creepData.creepAmount) creepData.creepAmount = spaces

            // spawn missing creeps
            for (let i = 0; i < creepData.creepAmount-creepData.creeps.length; i++) {
                // adjust task so first creep always goes to the taskPosition, others just path there
                if (creepData.creepAmount > 1 && i == 0 && (!creepData.creeps.length || creepData.creeps.length == 0)) t.useTaskPosition = true
                else t.useTaskPosition = false

                let spawn = this.findFreeSpawn(room)
                if (spawn) {
                    spawn.spawnCreep(creepData.body, `${t.taskType}${new Date().getTime()}`, { memory: { homeRoomName: room.name, task: t,}})
                    return //only spawn one creep per colony per tick
                }
            }
        });
    }

    public static checkTransportTasks(room: Room) {
        let transportTasks = Memory.colonies[room.name].tasks.filter(t => t.taskType == TaskType.TRANSPORT) as TaskTransportMemory[]
        if (!transportTasks.length) return;

        transportTasks.forEach(t => {
            t = clone(t)

            // get creep data
            let creepData = this.getCreepData(room, t)
            if (!creepData) return

            // spawn missing creeps
            for (let i = 0; i < creepData.creepAmount-creepData.creeps.length; i++) {
                let spawn = this.findFreeSpawn(room)
                if (spawn) {
                    spawn.spawnCreep(creepData.body, `${t.taskType}${new Date().getTime()}`, { memory: { homeRoomName: room.name, task: t,}})
                    return //only spawn one creep per colony per tick
                }
            }
        })
    }


    static getCreepData(room: Room, task: TaskMemory): CreepData | undefined {
        task = clone(task)
        let creepCostFull = getCostByParts(task.requiredParts)

        // if creepCost is smaller than room.energyCapacityAvailable (so we can spawn the whole creep),
        // then creepAmount will be 1. Otherwise, it will be larger.
        let creepAmount = Math.ceil(creepCostFull / room.energyCapacityAvailable)

        // look for creeps already doing this task
        let creeps = _.filter(Game.creeps, c => c.memory.task?.id == task.id && c.memory.homeRoomName == room.name)
        if (creeps.length >= creepAmount) return undefined

        // create fitting body
        let body = createBody(room.energyCapacityAvailable, task.requiredParts)
        let creepCostFinal = getCostByPartsArray(body)

        // break already if there's not enough energy for the creep.
        if (room.energyAvailable < creepCostFinal) return undefined

        return {
            creepCostfinal: creepCostFinal,
            creepAmount: creepAmount,
            creeps: creeps,
            body: body
        } as CreepData
    }


    static findFreeSpawn(room: Room): StructureSpawn | false {
        let spawns = room.find(FIND_MY_SPAWNS, {
            filter: (structure) => {
                return (structure.spawning == null)
            }
        });
        if (spawns.length > 0)
            return spawns[0]

        return false
    }
}

export interface CreepData {
    creepCostfinal: number,
    creepAmount: number,
    creeps: Creep[],
    body: BodyPartConstant[]
}
