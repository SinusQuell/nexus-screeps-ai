import { Rectangle } from "building/RampartsPlacer";

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

        return this.createRectangles(safePos, rectSize)
    }

    // creates an array of Rectangles from an array of RoomPositions
    private static createRectangles(positions: RoomPosition[], rectSize: number): Rectangle[] {
        let Rectangles: Rectangle[] = [];
        positions.forEach(s => {
            Rectangles.push(new Rectangle(s.x - rectSize, s.y - rectSize, s.x + rectSize, s.y + rectSize))
        })

        return Rectangles;
    }

    public static findSpotNearCenter(room: Room, rectangleWidth: number, rectangleHeight: number, notPlaceable: RoomPosition[] = []): RoomPosition | undefined {
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

        // Set the center of the room
        const centerX = 25;
        const centerY = 25;

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
                    const distance = Math.sqrt(Math.pow(centerX - spotX, 2) + Math.pow(centerY - spotY, 2));
                    if (distance < minDistance) {
                        minDistance = distance;
                        optimalSpot = new RoomPosition(x, y, room.name);
                    }
                }
            }
        }

        room.visual.rect(optimalSpot!.x, optimalSpot!.y, rectangleWidth-1, rectangleHeight-1, {fill: '#00FF00'})
        return optimalSpot
    }

    public static findSpotExclude(room: Room, rectangleWidth: number, rectangleHeight: number, rectangles: Rectangle[] = []): Rectangle | undefined {
        let excludePositions: RoomPosition[] = []
        rectangles.forEach(r => {
            excludePositions = excludePositions.concat(r.getRoomPositions(room.name))
        })
        let spot = this.findSpotNearCenter(room, rectangleWidth, rectangleHeight, excludePositions);
        return new Rectangle(spot!.x, spot!.y, spot!.x + rectangleWidth, spot!.y + rectangleHeight)
    }
}
