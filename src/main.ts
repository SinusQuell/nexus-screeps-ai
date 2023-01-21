import { ErrorMapper } from "utils/ErrorMapper";
import { SafeRect, RampartsPlacer } from "building/RampartsPlacer";
import { Colony } from "types";


declare global {
	// Memory extension
	interface Memory {
		allies: string[],
		colonies: Colony[]
	}
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
	console.log(`Current game tick is ${Game.time}`);

	let cpu = Game.cpu.getUsed();

	let rect_array: SafeRect[] = [];
	rect_array.push(new SafeRect(20, 6, 28, 27));
	rect_array.push(new SafeRect(29, 13, 34, 16));

	let ramps = new RampartsPlacer('sim', rect_array);
	ramps.test();

	cpu = Game.cpu.getUsed() - cpu;
	console.log('Needed', cpu, ' cpu time');

	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name];
		}
	}
});
