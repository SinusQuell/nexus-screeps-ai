import { Task, TaskTransportMemory } from "./Task"

export class TaskTransport extends Task {
    run(creep: Creep): ScreepsReturnCode {
        // get data
        const task: TaskTransportMemory = creep.memory.task!
        if (!task) return ERR_NOT_FOUND
        const fromPos = task.pos
        const toPos = task.toPosition

        // creep still has capacity, get energy
        if (creep.store.getFreeCapacity() > 0) {
            // get containers near point A
            const containers = Game.rooms[task.pos.roomName]
                .lookForAtArea(LOOK_STRUCTURES, fromPos.y-1, fromPos.x-1, fromPos.y+1, fromPos.x+1, true)
                .filter(s => s.structure.structureType == STRUCTURE_CONTAINER)

            // check what to empty
            let containerToEmpty = null
            let highestDropEnergy = null
            if (containers.length > 1) {
                // multiple containers here! Empty the fullest one
                let fullestNum = 0
                let fullestContainer: StructureContainer = {} as StructureContainer
                containers.forEach(c => {
                    if (c.structure.structureType == STRUCTURE_CONTAINER) {
                        if ((c.structure as StructureContainer).store.energy > fullestNum) {
                            fullestContainer = c.structure as StructureContainer
                            fullestNum = (c.structure as StructureContainer).store.energy
                        }
                    }
                });
                containerToEmpty = fullestContainer
            } else if (containers.length == 1) {
                // only one container here, empty it
                containerToEmpty = containers[0].structure as StructureContainer
            } else if (!containers || !containers.length || containers.length == 0) {
                // no containers here, get dropped energy
                const dropEnergy = Game.rooms[task.pos.roomName]
                    .lookForAtArea(LOOK_ENERGY, fromPos.y-1, fromPos.x-1, fromPos.y+1, fromPos.x+1, true)
                    .filter(s => s.energy.resourceType == RESOURCE_ENERGY);

                highestDropEnergy = dropEnergy[0].energy;
                for (let i = 0; i < dropEnergy.length; i++) {
                    if (highestDropEnergy.amount < dropEnergy[i].energy.amount) {
                        highestDropEnergy = dropEnergy[i].energy;
                    }
                }
            }

            //empty container
            if (containerToEmpty != null) {
                // move to container and withdraw energy
                if(creep.withdraw(containerToEmpty, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(new RoomPosition(containerToEmpty.pos.x, containerToEmpty.pos.y, containerToEmpty.pos.roomName))
                    return OK
                }
            } else if (highestDropEnergy != null) {
                // move to dropped energy and pick it up
                if(creep.pickup(highestDropEnergy) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(new RoomPosition(highestDropEnergy.pos.x, highestDropEnergy.pos.y, highestDropEnergy.pos.roomName))
                    return OK
                }
            } else {
                // nothing to pickup. TODO: idle
            }
        } else { // transport it to point B
            //check for structure with a store at the target
            if (!toPos) return ERR_NOT_FOUND

            let targetStructure = null
            targetStructure = Game.rooms[task.pos.roomName]
                .lookForAt(LOOK_STRUCTURES, toPos)
                .filter(s => this.isAnyStoreStructure(s) == true)[0]

            // move to target and deposit energy
            if (targetStructure) { // structure with a store found. transfer into it
                if(creep.transfer(targetStructure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(new RoomPosition(targetStructure.pos.x, targetStructure.pos.y, targetStructure.pos.roomName))
                    return OK
                }
            } else { // there is no structure with a spawn at the exact position.
                // look for spawns to fill near drop position.
                // TODO: maybe this can be done more effectively in other ways.
                // currently, at RCL1, transporters also fill the spawn. the first filler is only spawned at RCL2.
                if (creep.room.controller?.level == 1) {
                    const spawn = Game.rooms[task.pos.roomName]
                        .lookForAtArea(LOOK_STRUCTURES, fromPos.y-1, fromPos.x-1, fromPos.y+1, fromPos.x+1, true)
                        .filter(s => s.structure.structureType == STRUCTURE_SPAWN)[0].structure as StructureSpawn

                    const capacity = spawn.store.getFreeCapacity()
                    if (spawn && capacity != null && capacity > 0) {
                        if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(new RoomPosition(spawn.pos.x, spawn.pos.y, spawn.pos.roomName))
                            return OK
                        }
                    }
                }

                // drop energy next to target
                if (creep.pos.inRangeTo(toPos.x, toPos.y, 1)) {
                    creep.drop(RESOURCE_ENERGY)
                    return OK
                } else {
                    // no position to transport to in memory?
                }
            }
        }

        return OK
    }

    isAnyStoreStructure(structure: Structure): structure is AnyStoreStructure {
        return (
            structure instanceof StructureExtension ||
            structure instanceof StructureFactory ||
            structure instanceof StructureLab ||
            structure instanceof StructureLink ||
            structure instanceof StructureNuker ||
            structure instanceof StructurePowerSpawn ||
            structure instanceof StructureSpawn ||
            structure instanceof StructureStorage ||
            structure instanceof StructureTerminal ||
            structure instanceof StructureTower ||
            structure instanceof StructureContainer
        );
      }

}
