import { drop } from "lodash";
import { Task, TaskFillMemory } from "./Task"

export class TaskFill extends Task {
    run(creep: Creep): ScreepsReturnCode {
        // get data
        const task: TaskFillMemory = creep.memory.task!
        if (!task) return ERR_NOT_FOUND

        if (creep.store.energy == 0) { // get energy
            // TODO: maybe only pickup dropped energy at RCL 1?
            // get dropped energy if it's close
            let dropEnergies = creep.room.find(FIND_DROPPED_RESOURCES)
                .filter((d) => {return (d.resourceType == RESOURCE_ENERGY && d.amount >= 50)})

            let dropEnergy = creep.pos.findClosestByRange(dropEnergies)
            if (dropEnergy) {
                if (creep.pickup(dropEnergy) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(dropEnergy)
                }
            } else {
                //from storage first
	            if (creep.room.storage && creep.room.storage.store.energy >= creep.store.getFreeCapacity()) {
                    if(creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(creep.room.storage)
        	        }
	            } else {//from containers if no storage or it's empty
                    let containers = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_CONTAINER && structure.store.energy >= 50 && structure.pos.roomName == creep.room.name)
                        }
                    }) as StructureContainer[]

                    if (containers.length > 1) {
                        let highestEnergy = containers[0]
                        for (let i = 0; i < containers.length; i++) {
                            if (highestEnergy.store.energy < containers[i].store.energy) {
                                highestEnergy = containers[i]
                            }
                        }
                        if(creep.withdraw(highestEnergy, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(highestEnergy)
                        }
                    } else if (containers.length == 1) {
                        if(creep.withdraw(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(containers[0])
                        }
                    } else {
                        //nowhere to get energy. TODO: idle
                    }
	            }
            }
        } else { // fill stuff
            // fill towers below 501 energy first
            let towers = creep.room.find(FIND_STRUCTURES, {
                filter: (t) => {
                    return (t.structureType == STRUCTURE_TOWER)
                }
            }) as StructureTower[]

            let lowTowers = towers.filter(t => t.store.getFreeCapacity(RESOURCE_ENERGY) > 500)
            if (lowTowers.length) {
                if(creep.transfer(lowTowers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.travelTo(lowTowers[0]);
                }
            } else {
                let transTargets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => {
                        return (s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_SPAWN) && s.store.energy < s.store.getFreeCapacity(RESOURCE_ENERGY);
                    }
                });
                if(transTargets) {
                    if(creep.transfer(transTargets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.travelTo(transTargets);
                    }
                } else {
                    // fill all towers
                    let notFullTowers = towers.filter(t => t.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                    if (lowTowers.length) {
                        if(creep.transfer(lowTowers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.travelTo(lowTowers[0]);
                        }
                    } else {
                        // nothing to fill, TODO: idle
                    }
                }
            }
        }

        return OK
    }

}
