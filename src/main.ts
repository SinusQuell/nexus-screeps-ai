import { ErrorMapper } from "utils/ErrorMapper";
import { SafeRect, RampartsPlacer } from "building/RampartsPlacer";
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
	console.log(`Current game tick is ${Game.time}`)

	let cpu = Game.cpu.getUsed()

	let ramps = new RampartsPlacer('sim', RoomArchitect.getDefaultSafeRects('sim'))
	ramps.calculate()

	cpu = Game.cpu.getUsed() - cpu
	console.log('Needed', cpu, ' cpu time')

	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name]
		}
	}
});
