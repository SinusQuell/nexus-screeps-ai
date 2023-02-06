import { RequiredParts } from "creeps/tasks/Task";
import { clone } from "lodash";

// Expample 1: bodyBuilder().work(2).carry(1).move(1).finalise();
// returns: [WORK, WORK, CARRY, MOVE]
// Expample 2: bodyBuilder().work(2).carry(1).move(1).cost();
// returns: 300
const bodyImpl = (parts: BodyPartConstant[], cost: number) => {
	const add = (part: BodyPartConstant, count: number) => {
		return bodyImpl(
			parts.concat(Array(count).fill(part)),
			cost + BODYPART_COST[part] * count
		);
	};

	return {
		work: (count: number) => add(WORK, count),
		carry: (count: number) => add(CARRY, count),
		move: (count: number) => add(MOVE, count),
		tough: (count: number) => add(TOUGH, count),
		attack: (count: number) => add(ATTACK, count),
		ranged_attack: (count: number) => add(RANGED_ATTACK, count),
		heal: (count: number) => add(HEAL, count),
		claim: (count: number) => add(CLAIM, count),
		finalise: () => parts,
		cost: () => cost
	};
};

export const bodyBuilder = () => bodyImpl([], 0);

export function createBody(maxEnergy: number, requiredParts: RequiredParts): BodyPartConstant[] {
	let body: BodyPartConstant[] = [];
	let canAddParts = true;
	requiredParts = clone(requiredParts) // don't mutate directly in memory!

	while (maxEnergy > 0 && canAddParts) {
		canAddParts = false;

		for (const part of Object.keys(requiredParts)) {
			if (requiredParts[part as BodyPartConstant]! > 0 && maxEnergy >= BODYPART_COST[part as BodyPartConstant]) {
				body.push(part as BodyPartConstant);
				maxEnergy -= BODYPART_COST[part as BodyPartConstant];
				requiredParts[part as BodyPartConstant]!--;
				canAddParts = true;
			}
		}
		if(body.length >= MAX_CREEP_SIZE) canAddParts = false
	}

	return body;
}

export function getCostByParts(requiredParts: RequiredParts): number {
	if (!Object.keys(requiredParts).length) return 0;

	let cost = 0
	for (const part of Object.keys(requiredParts)) {
		if (requiredParts[part as BodyPartConstant]! > 0) {
			cost += BODYPART_COST[part as BodyPartConstant] * requiredParts[part as BodyPartConstant]!
		}
	}

	return cost;
}

export function getCostByPartsArray(requiredParts: BodyPartConstant[]): number {
	if (!requiredParts.length) return 0;

	let cost = 0
	requiredParts.forEach(p => {
		cost += BODYPART_COST[p]
	});

	return cost;
}
