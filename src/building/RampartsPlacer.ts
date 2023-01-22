import { util_mincut } from "./MinimumCut";

export class RampartsPlacer {
    public safeRects: Rectangle[]
    public roomName: string

    public wallPositions?: { x: number, y: number }[]

    private bounds = { x1: 0, y1: 0, x2: 49, y2: 49 }

    constructor(roomName: string, safeRects: Rectangle[]) {
        this.safeRects = safeRects
        this.roomName = roomName
    }

    public calculate(visualize: boolean = true) {
        // wallPositions is an array where to build walls/ramparts
        this.wallPositions = util_mincut.GetCutTiles(this.roomName, this.safeRects, this.bounds)
        if (visualize)
            this.visualize()
    }

    private visualize() {
        // draw rectangles for the designated safe areas
        this.safeRects.forEach(r => {
            Game.rooms[this.roomName].visual.rect(r.minX, r.minY, r.width, r.height)
        })

        // draw circles for the calculated wall positions
        this.wallPositions?.forEach(p => {
            Game.rooms[this.roomName].visual.circle(p.x, p.y, {
                radius: 0.3,
            })
        })
    }
}

export class Rectangle {
    public x1: number
    public y1: number
    public x2: number
    public y2: number

    public minX: number
    public maxX: number
    public minY: number
    public maxY: number
    public width: number
    public height: number

    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2

        this.minX = Math.min(this.x1, this.x2)
        this.maxX = Math.max(this.x1, this.x2)
        this.minY = Math.min(this.y1, this.y2)
        this.maxY = Math.max(this.y1, this.y2)
        this.width = Math.max(this.x1, this.x2) - Math.min(this.x1, this.x2)
        this.height = Math.max(this.y1, this.y2) - Math.min(this.y1, this.y2)
    }

    public getPositions(): {x: number, y: number}[] {
        let positions = []
        for (let x = this.minX; x < this.maxX; x++) {
            for (let y = this.minY; y < this.maxY; y++) {
                positions.push({x: x, y: y})
            }
        }
        return positions;
    }

    public getRoomPositions(roomName: string): RoomPosition[] {
        let positions: RoomPosition[] = []
        for (let x = this.minX; x < this.maxX; x++) {
            for (let y = this.minY; y < this.maxY; y++) {
                positions.push(new RoomPosition(x, y, roomName))
            }
        }
        return positions;
    }
}
