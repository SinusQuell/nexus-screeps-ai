import { ErrorMapper } from "utils/ErrorMapper";
import { Rectangle, RampartsPlacer } from "building/RampartsPlacer";
import { RoomArchitect } from "building/RoomArchitect";
import { Colony } from "types";


declare global {
	// Memory extension
	interface Memory {
		allies: string[],
		colonies: Colony[]
	}
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code. Does not work in simulation.
export const loop = ErrorMapper.wrapLoop(() => {
	let cpu = Game.cpu.getUsed()

	const rect1 = RoomArchitect.findSpotExclude(Game.rooms['sim'], 9, 9)
	const rect2 = RoomArchitect.findSpotExclude(Game.rooms['sim'], 7, 7, [rect1!])
	const rect3 = RoomArchitect.findSpotExclude(Game.rooms['sim'], 7, 7, [rect1!, rect2!])
	const rect4 = RoomArchitect.findSpotExclude(Game.rooms['sim'], 7, 7, [rect1!, rect2!, rect3!])
	const rect5 = RoomArchitect.findSpotExclude(Game.rooms['sim'], 5, 5, [rect1!, rect2!, rect3!, rect4!])


	let ramps = new RampartsPlacer('sim', RoomArchitect.getDefaultRectangles('sim').concat([rect1!, rect2!, rect3!, rect4!, rect5!]))
	ramps.calculate()


	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name]
		}
	}

	cpu = Game.cpu.getUsed() - cpu
	console.log('CPU this tick: ', cpu, 'ms. ', `Current tick is: ${Game.time}`)
});
