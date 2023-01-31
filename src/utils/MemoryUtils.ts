import { BuildHelper } from "building/BuildHelper";

export class MemoryUtils {

    // Check if a player is an ally
    public static checkAlly(user: string): boolean {
        if (!Memory.allies) Memory.allies = [];
        let allies = Memory.allies;
        for (let i = 0; i < allies.length; i++) {
            if (user == allies[i]) {
                return true;
            }
        }
        return false;
    }

    // Automatically delete memory of missing creeps
    public static cleanMemory() {
        for (const name in Memory.creeps) {
            if (!(name in Game.creeps)) {
                delete Memory.creeps[name]
            }
        }
    }

    // Initialize Colony Memory for new Colonies
    public static initColonyMemory(colonyOrigin: RoomPosition) {
        if (!Memory.colonies) Memory.colonies = {};

        // initialize colony obejct
        Memory.colonies[colonyOrigin.roomName] = {
            buildQueue: [],
            bunkerOrigin: colonyOrigin,
            RCL: 0,
            tasks: [],
            minerSpots: [],
        }

        // save mining positions
        let sources = Game.rooms[colonyOrigin.roomName].find(FIND_SOURCES);
        for (let i = 0; i < sources.length; i++) {
            let miningPos = BuildHelper.getPositionCloseToByPath(colonyOrigin.roomName, sources[i]);
            Memory.colonies[colonyOrigin.roomName].minerSpots[Memory.colonies[colonyOrigin.roomName].minerSpots.length] = {
                position: new RoomPosition(miningPos.x, miningPos.y, colonyOrigin.roomName),
                sourceIndex: i
            }
        }
    }
}
