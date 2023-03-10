import { Rectangle, RampartsPlacer } from "building/RampartsPlacer";
import { Colony } from "building/Colony";
import { BuildQueue } from "building/BuildQueue";
import { SourceHelper } from "utils/SourceHelper";
import { BuildHelper } from "./BuildHelper";

export class Architect {

    // returns an array of Rectangles around the following room structures:
    // Sources, Controller, Mineral
    static getDefaultRectangles(roomName: string, rectSize: number = 2): Rectangle[] {
        if (!Game.rooms[roomName]) return []; //check for vision

        // gather structure positions
        let safePos: RoomPosition[] = [];
        Game.rooms[roomName].find(FIND_SOURCES).forEach(x => safePos.push(x.pos))
        safePos.push(Game.rooms[roomName].controller!.pos);
        Game.rooms[roomName].find(FIND_MINERALS).forEach(x => safePos.push(x.pos))

        return Rectangle.createRectangles(safePos, rectSize)
    }

    static findSpaceNearPoint(
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

        room.visual.rect(optimalSpot!.x+1, optimalSpot!.y+1, rectangleWidth-3, rectangleHeight-3, {fill: '#F00'})
        room.visual.circle(optimalSpot, {radius: 0.3, fill: '#0F0'})
        if (label && label != '') room.visual.text(label, optimalSpot.x + rectangleWidth / 2, optimalSpot.y + rectangleHeight / 2)
        return optimalSpot
    }

    static findSpaceExclude(
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
        let furthestSource = SourceHelper.findFurthestSource(Game.rooms[roomName])

        const bunker = Architect.findSpaceExclude(Game.rooms[roomName], 13, 13, [], 'bunker', furthestSource?.pos)

        if (bunker) {
            let ramps = new RampartsPlacer(roomName, Architect.getDefaultRectangles(roomName).concat([bunker]))
            ramps.calculate()
        }
    }

    public static buildColonyStaged(room: Room, controller: StructureController) {
        if (!Colony.checkRclLevelUp(room.name)) return

        let originX = Memory.colonies[room.name].bunkerOrigin.x
        let originY = Memory.colonies[room.name].bunkerOrigin.y
        let newRCL = controller.level

        switch (newRCL) {
            case 2:
                // container near first spawn
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 1, room.name), STRUCTURE_CONTAINER)

                // 5x extenstions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 2, room.name), STRUCTURE_EXTENSION)

                // container near controller
                let containerPosController = BuildHelper.getPositionCloseToByPath(room.name, controller)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(containerPosController.x, containerPosController.y, room.name), STRUCTURE_CONTAINER)

                // containers near sources
                let minerSpots = Memory.colonies[room.name].minerSpots // see MemoryUtils.initColonyMemory, the positions saved there during initialization
                for (let i = 0; i < minerSpots.length; i++) {
                    BuildQueue.addToBuildQueue(room.name, new RoomPosition(minerSpots[i].position.x, minerSpots[i].position.y, room.name), STRUCTURE_CONTAINER)
                }

                // first early roads
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 2, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 1, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 1, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 1, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 2, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 2, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9, originY + 3, room.name), STRUCTURE_ROAD)

                break;
            case 3:
                // tower first
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 3, room.name), STRUCTURE_TOWER)

                // 5x extenstions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 1, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 4, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 3, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 4, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 4, room.name), STRUCTURE_EXTENSION)

                // roads to sources and controller
                let sources = Game.rooms[room.name].find(FIND_SOURCES);
                for (let i = 0; i < sources.length; i++) {
                    BuildHelper.buildRoad(room.name, sources[i].pos)
                }
                BuildHelper.buildRoad(room.name, room.controller!.pos)

                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 4, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9,  originY + 5, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 5, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2,  originY + 3, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1,  originY + 4, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1,  originY + 5, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1,  originY + 6, room.name), STRUCTURE_ROAD)

                // TODO: add areas to memory, where creeps can/cannot go to idle. Old Codebase used flags for this.
                break;
            case 4:
                // storage
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 3, room.name), STRUCTURE_STORAGE)

                // 10x extensions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7 , originY + 1, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8 , originY + 1, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 1, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 2, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 3, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 3, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 4, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 5, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8 , originY + 5, room.name), STRUCTURE_EXTENSION)

                // more bunker roads
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 3 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 4 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 5 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 4 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 6 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 6 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 7 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 8 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 9 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 10, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 9 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 11, room.name), STRUCTURE_ROAD)

                break;
            case 5:
                // second tower
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9, originY + 4, room.name), STRUCTURE_TOWER)

                // 10x extensions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2 , originY + 5, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2 , originY + 6, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 6, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 7, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 8, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 12, originY + 4, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 12, originY + 5, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 12, originY + 6, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 12, originY + 7, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 7, room.name), STRUCTURE_EXTENSION)

                // links for source 1 and controller
                let linkPositionController = BuildHelper.getPositionCloseToByPath(room.name, controller)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(linkPositionController.x, linkPositionController.y, room.name), STRUCTURE_LINK)

                sources = Game.rooms[room.name].find(FIND_SOURCES);
                let linkPositionSourceOne = BuildHelper.getPositionCloseToByPath(room.name, sources[0], 2)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(linkPositionSourceOne.x, linkPositionSourceOne.y, room.name), STRUCTURE_LINK)

                // remaining bunker roads
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6 , originY + 6 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7 , originY + 7 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6 , originY + 11, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7 , originY + 10, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8 , originY + 10, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 9 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 10, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 8 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 7 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 6 , room.name), STRUCTURE_ROAD)

                // roads surrounding bunker
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 1 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 2 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 3 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 4 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 5 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 6 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 6 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 7 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 8 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 0, originY + 9 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9, originY + 0 , room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 10, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 11, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 12, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 1, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 2, room.name), STRUCTURE_ROAD)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 12, originY + 3, room.name), STRUCTURE_ROAD)

                //TODO: Ramparts Layer 1

                break;
            case 6:
                // 10x extensions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 7 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 8 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 8 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 8 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 8 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 7 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 10, room.name), STRUCTURE_EXTENSION)

                // link for source 2
                sources = Game.rooms[room.name].find(FIND_SOURCES);
                let linkPositionSourceTwo = BuildHelper.getPositionCloseToByPath(room.name, sources[1], 2)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(linkPositionSourceTwo.x, linkPositionSourceTwo.y, room.name), STRUCTURE_LINK)

                // extractor an road to mineral
                let mineral = controller.pos.findClosestByRange(FIND_MINERALS);
                BuildHelper.buildRoad(room.name, mineral!.pos)
                BuildQueue.addToBuildQueue(room.name, mineral!.pos, STRUCTURE_EXTRACTOR)

                //terminal & 3x labs
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 5, room.name), STRUCTURE_TERMINAL)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 6, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 7, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 7, room.name), STRUCTURE_LAB)

                //TODO: Ramparts Layer 2

                break;

            case 7:
                // thrid tower, second spawn
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 6, room.name), STRUCTURE_TOWER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5 , originY + 4, room.name), STRUCTURE_SPAWN)

                // 10x extenstions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 2, originY + 10, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 10, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 12, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 12, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 12, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 12, room.name), STRUCTURE_EXTENSION)

                // bunker link, 3x labs
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 4, room.name), STRUCTURE_LINK)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 8, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 8, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 7, room.name), STRUCTURE_LAB)

                // factory
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 5, originY + 3, room.name), STRUCTURE_FACTORY)

                //TODO: Ramparts Layer 3

                break;

            case 8:
                // 3x towers, third spawn
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 7 , room.name), STRUCTURE_TOWER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 9 , room.name), STRUCTURE_TOWER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 10, room.name), STRUCTURE_TOWER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 1, originY + 3 , room.name), STRUCTURE_SPAWN)

                // 10x extensions
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7 , originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8 , originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 11, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 9 , originY + 10, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 10, room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 9 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 11, originY + 8 , room.name), STRUCTURE_EXTENSION)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 10, originY + 9 , room.name), STRUCTURE_EXTENSION)

                // second controller link
                let linkTwoPositionController = BuildHelper.getPositionCloseToByPath(room.name, controller)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(linkTwoPositionController.x, linkTwoPositionController.y, room.name), STRUCTURE_LINK)

                // 4x labs
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 6, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 6, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 7, originY + 5, room.name), STRUCTURE_LAB)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 6, originY + 5, room.name), STRUCTURE_LAB)

                //observer, nuker, powerspawn
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 8, originY + 8, room.name), STRUCTURE_OBSERVER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 4, originY + 3, room.name), STRUCTURE_NUKER)
                BuildQueue.addToBuildQueue(room.name, new RoomPosition(originX + 3, originY + 5, room.name), STRUCTURE_POWER_SPAWN)

                //TODO: 6th link (for remote mines?)

                break;

            default:
                break;
        }
    }
}
