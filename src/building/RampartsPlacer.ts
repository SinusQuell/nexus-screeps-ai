import { util_mincut } from "./MinimumCut";

export class RampartsPlacer {
    public safeRects: SafeRect[]
    public roomName: string

    public wallPositions?: {x: number, y: number}[];

    private bounds = { x1: 0, y1: 0, x2: 49, y2: 49 };

    constructor(roomName: string, safeRects: SafeRect[]) {
        this.safeRects = safeRects;
        this.roomName = roomName;
      }

    public test() {
		this.wallPositions = util_mincut.GetCutTiles(this.roomName, this.safeRects, this.bounds); // Positions is an array where to build walls/ramparts
        this.visualize()
		// const ramparts = Game.rooms[roomname].find(FIND_STRUCTURES, {filter: s => s.structureType === 'rampart'});
		// const rampartsC = Game.rooms[roomname].find(FIND_CONSTRUCTION_SITES, {filter: c => c.structureType === 'rampart'});
		// if (rampartsC.length + ramparts.length < positions.length) {
		// 	for (let i in positions) {
		// 		Game.rooms[roomname].createConstructionSite(positions[i].x, positions[i].y, 'rampart');
		// 	}
		// }
		// return 'Finished';
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
export class SafeRect {
    public x1: number;
    public y1: number;
    public x2: number;
    public y2: number;

    public minX: number;
    public minY: number;
    public width: number;
    public height: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.minX   = Math.min(this.x1, this.x2);
        this.minY   = Math.min(this.y1, this.y2);
        this.width  = Math.max(this.x1, this.x2) - Math.min(this.x1, this.x2);
        this.height = Math.max(this.y1, this.y2) - Math.min(this.y1, this.y2)
    }


}
