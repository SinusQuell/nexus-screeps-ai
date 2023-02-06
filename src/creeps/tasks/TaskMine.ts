import { Task, TaskMineMemory } from "./Task"

export class TaskMine extends Task {
    run(creep: Creep): ScreepsReturnCode {
        // get data
        let task: TaskMineMemory = creep.memory.task!
        let source = creep.room.find(FIND_SOURCES)[task.sourceIndex!]
        if (!task || !source) return ERR_NOT_FOUND

        // move to source
        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
            // use saved mining position or just path to source?
            if (task.useTaskPosition && task.pos) creep.travelTo(new RoomPosition(task.pos.x, task.pos.y, task.pos.roomName))
            else creep.travelTo(source.pos)

            return OK
        }
        return OK
    }
}
