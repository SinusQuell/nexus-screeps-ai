import { MemoryUtils } from "utils/MemoryUtils";

export class Nexus {

    // GLobal Settings
    public static NX_CONSTRUCTIONS_PER_BASE = 5

    // This should be called from the Console right after placing the very first spawn in the world.
    // It initializes the Bot and should never be run again.
    public static initialize(roomName: string) {
        let firstSpawn = Game.rooms[roomName].find(FIND_MY_STRUCTURES, {
            filter: s => { return s.structureType == STRUCTURE_SPAWN }
        })[0]
        Memory.nexusInitialized = true

        MemoryUtils.initColonyMemory(new RoomPosition(firstSpawn.pos.x - 3, firstSpawn.pos.y - 1, roomName))

        //TODO: Write a logger to simplify colored outputs
        return `<font color="#9dff00" type="highlight"> Nexus initialized. Commencing Colony Protocol Alpha. </font>`
    }
}
