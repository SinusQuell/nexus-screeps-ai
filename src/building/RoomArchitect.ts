import { Rectangle, RampartsPlacer } from "building/RampartsPlacer";
import { SourceHelper } from "utils/SourceHelper";

export class RoomArchitect {

    // returns an array of Rectangles around the following room structures:
    // Sources, Controller, Mineral
    public static getDefaultRectangles(roomName: string, rectSize: number = 2): Rectangle[] {
        if (!Game.rooms[roomName]) return []; //check for vision

        // gather structure positions
        let safePos: RoomPosition[] = [];
        Game.rooms[roomName].find(FIND_SOURCES).forEach(x => safePos.push(x.pos))
        safePos.push(Game.rooms[roomName].controller!.pos);
        Game.rooms[roomName].find(FIND_MINERALS).forEach(x => safePos.push(x.pos))

        return Rectangle.createRectangles(safePos, rectSize)
    }

    public static findSpaceNearPoint(
        room: Room,
        rectangleWidth: number,
        rectangleHeight: number,
        notPlaceable: RoomPosition[] = [],
        label: string = '',
        closeTo: RoomPosition | undefined
    ): RoomPosition | undefined
    {
        // default is as close to center as possible
        if (!closeTo) closeTo = new RoomPosition(25, 25, room.name)

        // Create a 2D array to represent the room
        const roomMap: number[][] = [];
        for (let x = 0; x < 50; x++) {
            roomMap[x] = [];
            for (let y = 0; y < 50; y++) {
                // Set the value to 1 if the tile is a wall or has a structure or is in the notPlaceable array, 0 otherwise
                roomMap[x][y] = (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL
                    || _.filter(room.lookForAt(LOOK_STRUCTURES, x, y), s => s.structureType != STRUCTURE_ROAD).length > 0
                    || _.find(notPlaceable, np => np.x === x && np.y === y)) ? 1 : 0;
            }
        }

        // Set the initial minimum distance to a high value
        let minDistance = Number.MAX_SAFE_INTEGER;
        let optimalSpot: RoomPosition | undefined;

        // Iterate through the room to find available spots
        for (let x = 0; x < 50 - rectangleWidth; x++) {
            for (let y = 0; y < 50 - rectangleHeight; y++) {
                let available = true;
                // Check if the spot is available
                for (let i = x; i < x + rectangleWidth; i++) {
                    for (let j = y; j < y + rectangleHeight; j++) {
                        if (roomMap[i][j] === 1) {
                            available = false;
                            break;
                        }
                    }
                    if (!available) {
                        break;
                    }
                }
                // If the spot is available, calculate the distance to the center
                if (available) {
                    const spotX = x + rectangleWidth / 2;
                    const spotY = y + rectangleHeight / 2;
                    const distance = Math.sqrt(Math.pow(closeTo.x - spotX, 2) + Math.pow(closeTo.y - spotY, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        optimalSpot = new RoomPosition(x, y, room.name);
                    }
                }
            }
        }

        if (!optimalSpot) return undefined

        room.visual.rect(optimalSpot!.x+1, optimalSpot!.y+1, rectangleWidth-3, rectangleHeight-3, {fill: '#FF0000'})
        if (label && label != '') room.visual.text(label, optimalSpot!.x + rectangleWidth / 2, optimalSpot!.y + rectangleHeight / 2)
        return optimalSpot
    }

    public static findSpaceExclude(
        room: Room,
        rectangleWidth: number,
        rectangleHeight: number,
        rectangles: Rectangle[] = [],
        label: string = '',
        closeTo: RoomPosition | undefined = undefined
    ): Rectangle | undefined
    {
        let excludePositions: RoomPosition[] = []
        rectangles.forEach(r => {
            excludePositions = excludePositions.concat(r.getRoomPositions(room.name))
        })
        let spot = this.findSpaceNearPoint(room, rectangleWidth, rectangleHeight, excludePositions, label, closeTo);
        if (!spot) return undefined
        return new Rectangle(spot!.x+1, spot!.y+1, spot!.x-2 + rectangleWidth, spot!.y-2 + rectangleHeight)
    }

    public static findBunkerSpot(roomName: string) {
        let furthestSource = SourceHelper.findFurthestSource(Game.rooms['sim']);

        const bunker = RoomArchitect.findSpaceExclude(Game.rooms['sim'], 13, 13, [], 'bunker', furthestSource?.pos)

        if (bunker) {
            let ramps = new RampartsPlacer('sim', RoomArchitect.getDefaultRectangles('sim').concat([bunker!]))
            ramps.calculate()
        }
    }
}
