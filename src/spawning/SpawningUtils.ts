// Expample 1: bodyBuilder().work(2).carry(1).move(1).finalise();
// returns: [WORK, WORK, CARRY, MOVE]
// Expample 2: bodyBuilder().work(2).carry(1).move(1).cost();
// returns: 300
const bodyImpl = (parts: BodyPartConstant[], cost: number) => {
	const add = (part: BodyPartConstant, count: number, cost: number) => {
		return bodyImpl(parts.concat(Array(count).map(() => part)), cost * count);
	}

	return {
		work: (count: number) => add(WORK, count, 100),
		carry: (count: number) => add(CARRY, count, 50),
		move: (count: number) => add(MOVE, count, 50),
		tough: (count: number) => add(TOUGH, count, 10),
		attack: (count: number) => add(ATTACK, count, 80),
		rangedAttack: (count: number) => add(RANGED_ATTACK, count, 150),
		heal: (count: number) => add(HEAL, count, 250),
		claim: (count: number) => add(CLAIM, count, 600),
		finalise: () => parts,
		cost: () => cost,
	};
};

export const bodyBuilder = () => bodyImpl([], 0);
