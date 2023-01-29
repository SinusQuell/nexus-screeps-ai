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
        this.initMemory()

        Memory.colonies[colonyOrigin.roomName] = {
            buildQueue: [],
            bunkerOrigin: colonyOrigin,
            RCL: 0,
            tasks: [],
            minerSpots: [],
        }
    }

    // Initialize Global Memory Objects
    public static initMemory() {
        if (!Memory.colonies) Memory.colonies = {};
    }
}
