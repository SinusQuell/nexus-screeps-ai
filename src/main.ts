import { ErrorMapper } from "utils/ErrorMapper";
import { MemoryUtils } from "utils/MemoryUtils";
import { Nexus } from "utils/Nexus";
import { BuildQueue } from "building/BuildQueue";
import { ColonyMemory } from "building/Colony";
import { RoomArchitect } from "building/RoomArchitect";
import { Traveler } from "creeps/Traveler";

global.Nexus = Nexus;
declare global {
	// Memory extension
	interface Memory {
		allies: string[],
		colonies: { [key: string]: ColonyMemory },
		nexusInitialized: boolean
	}
	interface CreepMemory {
		_trav: TravelData
	}
	interface RoomMemory {
		avoid?: number
	}

	// Globals
	namespace NodeJS {
		interface Global {
		  Nexus: Nexus
		}
	}
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code. Does not work in simulation.
export const loop = ErrorMapper.wrapLoop(() => {
	let cpu = Game.cpu.getUsed()

	if (!Memory.nexusInitialized) {
		console.log(`<font color="#f2ff00" type="highlight">No rooms found. Please run \"Nexus.initialize(roomName)\" after placing the first spawn. </font>`)
		return;
	}

	// Loop through owned rooms
	for (let roomName in Game.rooms) {
		let controller = Game.rooms[roomName].controller
		let room = Game.rooms[roomName]
		if (!controller || !controller.my) return // no controller or room not owned

		if (Game.time % 3 == 0) {
			RoomArchitect.buildColonyStaged(room, controller);
			BuildQueue.buildFromQueue(roomName);
		}
	}

	MemoryUtils.cleanMemory()

	cpu = Game.cpu.getUsed() - cpu
	console.log('CPU this tick: ', cpu, 'ms. ', `Current tick is: ${Game.time}`)
});
