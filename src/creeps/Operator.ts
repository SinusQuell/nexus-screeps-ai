import { TaskFillMemory, TaskMineMemory, TaskTransportMemory, TaskType } from "./tasks/Task"
import { v4 as uuid } from 'uuid';
import { createTask } from "./tasks/TaskMapper";

export class Operator {

    public static operateCreeps() {
        for(let name in Game.creeps) {
            let creep = Game.creeps[name];
            try {
                if (creep.memory.task) {
                    let task = createTask(creep.memory.task?.taskType)
                    task.run(creep);
                }
            } catch (error: any) {
                console.log(error.stack);
            }
        }
    }

    // TODO: cleanup tasks at some point based on current information. maybe delete task when creep dies or task is done?
    public static updateColonyTasks(room: Room) {
        this.updateFillTasks(room)
        this.updateMiningTasks(room)
        this.updateTransportTasks(room)
    }

    static updateMiningTasks(room: Room) {
        // look for existing tasks
        let minerSpots = Memory.colonies[room.name].minerSpots
        let mineTasks = Memory.colonies[room.name].tasks.filter(x => x.taskType == TaskType.MINE) as TaskMineMemory[]
        if (mineTasks.length == minerSpots.length) return

        // loop through minerSpots and create mining tasks if nessessary
        for (let i = 0; i < minerSpots.length; i++) {
            // look for existing task for this spot
            if (mineTasks.find(x => x.sourceIndex == minerSpots[i].sourceIndex)) continue

            //didn't find a task for this spot! create one
            Memory.colonies[room.name].tasks[Memory.colonies[room.name].tasks.length] = {
                id: uuid(),
                taskType: TaskType.MINE,
                pos: minerSpots[i].position,
                sourceIndex: minerSpots[i].sourceIndex,
                requiredParts: {
                    work: 6,
                    move: 1,
                }
            } as TaskMineMemory
        }
    }

    static updateTransportTasks(room: Room) {
        // look for existing tasks
        let transportTasks = Memory.colonies[room.name].tasks.filter(x => x.taskType == TaskType.TRANSPORT) as TaskTransportMemory[]

        // loop through sources and create transport tasks if nessessary
        let sources = room.find(FIND_SOURCES)
        for (let i = 0; i < sources.length; i++) {
            // look for existing task for this spot
            if (transportTasks.find(x => x.sourceIndex == i)) continue

            // find container or drop spot near controller
            let controllerDropSpot = null
            if (room.controller) {
                let container = room.controller.pos.findInRange(FIND_STRUCTURES, 2).filter(s => s.structureType == STRUCTURE_CONTAINER)
                if (container && container.length > 0) controllerDropSpot = container[0].pos
                else controllerDropSpot = room.controller.pos
            }

            let baseDropPos: RoomPosition;
            if (room.storage) baseDropPos = room.storage.pos // use storage if it exists
            else baseDropPos = new RoomPosition( // else drop it on the containerSpot next to the first spawn
                Memory.colonies[room.name].bunkerOrigin.x + 1,
                Memory.colonies[room.name].bunkerOrigin.y,
                Memory.colonies[room.name].bunkerOrigin.roomName
            )

            // no transport task for this source! create one
            Memory.colonies[room.name].tasks[Memory.colonies[room.name].tasks.length] = {
                id: uuid(),
                taskType: TaskType.TRANSPORT,
                pos: sources[i].pos,
                sourceIndex: i,
                toPosition: i == 0 ? baseDropPos : controllerDropSpot,
                requiredParts: {
                    carry: 16,
                    move: 8,
                }
            } as TaskTransportMemory
        }

        // TODO: create transport tasks for remote mines
    }

    static updateFillTasks(room: Room) {
        // look for existing tasks
        let fillTasks = Memory.colonies[room.name].tasks.filter(x => x.taskType == TaskType.FILL) as TaskFillMemory[]

        // always one filler per room
        if (!fillTasks || fillTasks.length <= 0) {
            // no transport task for this source! create one
            Memory.colonies[room.name].tasks[Memory.colonies[room.name].tasks.length] = {
                id: uuid(),
                taskType: TaskType.FILL,
                pos: new RoomPosition(25, 25, room.name), // filler doesn't need a position, but it can't be empty
                requiredParts: {
                    carry: 16,
                    move: 8,
                }
            } as TaskFillMemory
        }
    }


}
