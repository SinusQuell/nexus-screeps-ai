export class SourceHelper  {

    public static findFurthestSource(room: Room): Source | undefined {
        // Get the exits of the room
        const exits = room.find(FIND_EXIT);
        // Initialize the max distance and the furthest source
        let maxDistance = 0;
        let furthestSource: Source | undefined;
        // Iterate through all the sources in the room
        for (const source of room.find(FIND_SOURCES)) {
            // Initialize the min distance for the current source
            let minDistance = Number.MAX_SAFE_INTEGER;
            // Iterate through all the exits
            for (const exit of exits) {
                // Calculate the distance between the source and the exit
                const distance = source.pos.findPathTo(exit, {
                    ignoreRoads: true,
                }).length;
                // Update the min distance if this distance is smaller
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            // Update the max distance and the furthest source if this min distance is larger
            if (minDistance > maxDistance) {
                maxDistance = minDistance;
                furthestSource = source;
            }
        }
        return furthestSource;
    }

    public static findSourceClosestTo(position: RoomPosition, byPath = true): Source | null {
        let room = Game.rooms[position.roomName];
        if (!room) return null

        if (byPath) return position.findClosestByPath(FIND_SOURCES)
        else return position.findClosestByRange(FIND_SOURCES)
    }

    public static getSourceSpaceAmount(source: Source): number {
        if (!Game.rooms[source.room.name]) return 0// check for vision

        let fields = Game.rooms[source.room.name].lookForAtArea(LOOK_TERRAIN, source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x+1, true);
        let accessibleFields = 9-_.countBy( fields , "terrain" ).wall;
        return accessibleFields;
    }

    public static getWalkableSpaces(source: Source) {
        if (!Game.rooms[source.room.name]) return; // check for vision

        const fields = Game.rooms[source.room.name].lookForAtArea(LOOK_TERRAIN, source.pos.y-1, source.pos.x-1, source.pos.y+1, source.pos.x+1, true);
        const accessibleFields = 9-_.countBy( fields , "terrain" ).wall;
        return accessibleFields;
    }

}
