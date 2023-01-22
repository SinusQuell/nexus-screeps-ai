import { BuildQueueMemory } from "building/BuildQueue";
export class Colony {

}

export interface ColonyMemory {
    buildQueue: BuildQueueMemory[],
    bunkerOrigin: RoomPosition
}
