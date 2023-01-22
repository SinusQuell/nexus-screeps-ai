import { ErrorMapper } from "utils/ErrorMapper";
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

	// Loop through owned rooms
	for (let roomName in Game.rooms) {
		let controller = Game.rooms[roomName].controller;
		if (!controller || !controller.my) return; // no controller or not owned

		RoomArchitect.findBunkerSpot(roomName);
	}

	// Automatically delete memory of missing creeps
	for (const name in Memory.creeps) {
		if (!(name in Game.creeps)) {
			delete Memory.creeps[name]
		}
	}

	cpu = Game.cpu.getUsed() - cpu
	console.log('CPU this tick: ', cpu, 'ms. ', `Current tick is: ${Game.time}`)
});
