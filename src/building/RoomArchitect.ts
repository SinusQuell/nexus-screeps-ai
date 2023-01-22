import { SafeRect } from "building/RampartsPlacer";

export class RoomArchitect {

    // returns an array of SafeRects around the following room structures:
    // Sources, Controller, Mineral
    public static getDefaultSafeRects(roomName: string, rectSize: number = 2): SafeRect[] {
        if (!Game.rooms[roomName]) return []; //check for vision

        // gather structure positions
        let safePos: RoomPosition[] = [];
        Game.rooms[roomName].find(FIND_SOURCES).forEach(x => safePos.push(x.pos))
        safePos.push(Game.rooms[roomName].controller!.pos);
        Game.rooms[roomName].find(FIND_MINERALS).forEach(x => safePos.push(x.pos))

        return this.createSafeRects(safePos, rectSize)
    }

    // creates an array of SafeRects from an array of RoomPositions
    private static createSafeRects(positions: RoomPosition[], rectSize: number): SafeRect[] {
        let safeRects: SafeRect[] = [];
        positions.forEach(s => {
            safeRects.push(new SafeRect(s.x - rectSize, s.y - rectSize, s.x + rectSize, s.y + rectSize))
        })

        return safeRects;
    }
}
