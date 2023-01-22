import { MemoryUtils } from "utils/MemoryUtils";

export class Nexus {

    // This should be called from the Console right after placing the very first spawn in the world.
    // It initializes the Bot and should never be run again.
    public static initialize(roomName: string) {
        let firstSpawn = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
            filter: s => { return s.structureType == STRUCTURE_SPAWN }
        })[0]
        console.log(firstSpawn);

        MemoryUtils.initColonyMemory(new RoomPosition(firstSpawn.pos.x - 3, firstSpawn.pos.y - 1, roomName))
    }
}
