export interface TaskMemory {
    taskType: TaskType,
    taskPosition?: RoomPosition
}

export enum TaskType {
    mine = 'm',
    upgrade = 'u',
    build = 'b',
    transport = 't',
    fill = 'f'
}

export abstract class Task {
    abstract run(creep: Creep): ScreepsReturnCode
}
