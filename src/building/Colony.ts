import { BuildQueueMemory } from "building/BuildQueue";
import { Task } from "creeps/tasks/Task";
export class Colony {

    public static checkRclLevelUp(roomName: string): boolean {
        if (!Game.rooms[roomName] || !Game.rooms[roomName].controller) return false

        if (Memory.colonies[roomName].RCL < Game.rooms[roomName]!.controller!.level) {
            Memory.colonies[roomName].RCL = Game.rooms[roomName]!.controller!.level
            return true
        } else return false
    }

}

export interface ColonyMemory {
    buildQueue: BuildQueueMemory[],
    bunkerOrigin: RoomPosition,
    RCL: number,
    tasks: Task[],
    minerSpots: MinerSpot[],
}

export interface MinerSpot {
    position: RoomPosition,
    sourceIndex: number
}
