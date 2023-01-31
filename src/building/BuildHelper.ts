import { Traveler } from "creeps/Traveler";
import { BuildQueue } from "./BuildQueue";

export class BuildHelper {
    public static getPositionCloseToByPath(roomName: string, target: RoomObject, range: number = 1): PathStep {
        let spawn = Game.rooms[roomName].find(FIND_MY_SPAWNS);
        let path = Game.rooms[roomName].findPath(spawn[0].pos, target.pos, {range: range, ignoreCreeps: true, ignoreRoads: true});
        let resultPosition = path[path.length - 1];
        return resultPosition;
    }

    //BuildRoad only works from rooms with autobuild enabled!
    /** This needs vision in all Rooms it builds in. */
    public static buildRoad(startRoomName: string, endPos: RoomPosition, containerAtEnd = false) {
        let spawns = Game.rooms[startRoomName].find(FIND_MY_SPAWNS);
        let startPos = spawns[0].pos;

        let road = Traveler.findTravelPath(startPos, endPos,
        {
            range: 1,
            ignoreCreeps: true,
            roomCallback(roomName: string): boolean | CostMatrix{
                let room = Game.rooms[roomName];
                //Need vision in all rooms along the path
                if (!room) return false;
                let costs = new PathFinder.CostMatrix;
                room.find(FIND_STRUCTURES).forEach(function(struct) {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        // Favor roads over plain tiles
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        // Can't walk through non-walkable buildings
                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                    }
                });
                //treat roads that are still under construction as if they were finished
                room.find(FIND_MY_CONSTRUCTION_SITES).forEach(function(constr) {
                     if (constr.structureType == STRUCTURE_ROAD) {
                         costs.set(constr.pos.x, constr.pos.y, 1);
                     }
                });
                return costs;
            },
        })

        let path = BuildHelper.getPathWithoutBunkerPositions(road.path, startRoomName);

        if (containerAtEnd == true) {
            let last = _.last(path);
            BuildQueue.addToBuildQueue(startRoomName, last, STRUCTURE_CONTAINER)
        }
        for (let i = 0; i < path.length; i++) {
            BuildQueue.addToBuildQueue(startRoomName, path[i], STRUCTURE_ROAD)
        }

    }

    public static getPathWithoutBunkerPositions(path: RoomPosition[], startRoomName: string): RoomPosition[] {
        let newPath = path;
        for (let i = 0; i < newPath.length; i++) {
            _.remove(newPath, function(p) {
                return BuildHelper.isPositionInsideBunker(p, startRoomName)
            });
        }
        return newPath;
    }

    static bunkerPositions = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0],
        [0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
        [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1],
        [0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1],
        [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
        [0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0],
        [0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0],
        [0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0]
    ]
    public static isPositionInsideBunker(position: RoomPosition, roomName: string): boolean {
        let originX = Memory.colonies[roomName].bunkerOrigin.x
        let originY = Memory.colonies[roomName].bunkerOrigin.y

        for (let x = 0; x < 13; x++) {
            for (let y = 0; y < 13; y++) {
                let bunkerX = x + originX
                let bunkerY = y + originY

                 // current loop pos is not  the position we are checking
                if (position.x != bunkerX || position.y != bunkerY) continue

                // check if the position is a slot that is considered "inside". See BuildHelper.bunkerPositions
                if (BuildHelper.bunkerPositions[x][y] == 1) return true
                else return false
            }
        }

        return false
    }
}
