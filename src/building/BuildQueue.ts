export class BuildQueue {

    // add a new structure to the build queue
    public static addToBuildQueue(colonyRoomName: string, buildPosition: RoomPosition, structureType: BuildableStructureConstant) {
        Memory.colonies[colonyRoomName].buildQueue[Memory.colonies[colonyRoomName].buildQueue.length] = {buildPosition, structureType}
    }

    public static buildFromQueue(colonyRoomName: string) {
        if (!Memory.colonies || !Memory.colonies[colonyRoomName]) return;
        let buildQueue = Memory.colonies[colonyRoomName].buildQueue
        console.log("building...");

        if (!buildQueue || buildQueue.length <= 0) return // BuildQueue is empty or doesn't exist
        if (Object.keys(Game.constructionSites).length >= MAX_CONSTRUCTION_SITES - 20) return // global limit for construction sites reached

        let toBuild = buildQueue[0]
        let buildRoom = Game.rooms[toBuild.buildPosition.roomName]
        if (!buildRoom) return //check for vision

        // only ever place a certain amount of construction sites per colony
        let cSiteCount = buildRoom.find(FIND_MY_CONSTRUCTION_SITES).length
        if (cSiteCount >= NX_CONSTRUCTIONS_PER_BASE) return

        // check for creep at the position, as they block construction via code
        let creeps = buildRoom.lookForAt(LOOK_CREEPS, toBuild.buildPosition.x, toBuild.buildPosition.y)
        if (creeps.length && creeps.length > 0) return

        // check if there is already a construction site here
        let cSite = buildRoom.lookForAt(LOOK_CONSTRUCTION_SITES, toBuild.buildPosition.x, toBuild.buildPosition.y)
        if ((cSite.length && cSite.length > 0)) {
            // check if it's the same structure type. if so, this is a duplicate.
            if (cSite[0].structureType == toBuild.structureType) {
                Memory.colonies[colonyRoomName].buildQueue = _.drop(buildQueue)
                return
            }
            //move entry to the end of the queue
            this.addToBuildQueue(colonyRoomName, toBuild.buildPosition, toBuild.structureType)
            Memory.colonies[colonyRoomName].buildQueue = _.drop(buildQueue)
            return
        }

        let result = Game.rooms[toBuild.buildPosition.roomName].createConstructionSite(toBuild.buildPosition.x, toBuild.buildPosition.y, toBuild.structureType)

        if (result == OK) {
            //built ok, remove entry
            Memory.colonies[colonyRoomName].buildQueue = _.drop(buildQueue)
        } else {
            //build failed, move entry to the end of the queue
            this.addToBuildQueue(colonyRoomName, toBuild.buildPosition, toBuild.structureType)
            Memory.colonies[colonyRoomName].buildQueue = _.drop(buildQueue)
        }
    }
}

export interface BuildQueueMemory {
    buildPosition: RoomPosition
    structureType: BuildableStructureConstant
}
