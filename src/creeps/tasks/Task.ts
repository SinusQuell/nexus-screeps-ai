export interface TaskMemory {
    id: string,
    taskType: TaskType,
    pos: RoomPosition,
    requiredParts: RequiredParts
}

export interface TaskMineMemory extends TaskMemory {
    sourceIndex?: number,
    useTaskPosition?: boolean
}

export interface RequiredParts {
    work?: number,
    carry?: number,
    move?: number,
    tough?: number,
    attack?: number,
    ranged_attack?: number,
    heal?: number,
    claim?: number,
}

export abstract class Task {
    abstract run(creep: Creep): ScreepsReturnCode
}

export enum TaskType {
    MINE = 'm',
    UPGRADE = 'u',
    BUILD = 'b',
    TRANSPORT = 't',
    FILL = 'f'
}
