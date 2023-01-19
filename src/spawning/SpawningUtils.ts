// Expample call: bodyBuilder().work(2).carry(1).move(1).finalise();
// returns: [WORK, WORK, CARRY, MOVE]
const bodyImpl = (parts: BodyPartConstant[]) => {
  const add = (part: BodyPartConstant, count: number) =>
    bodyImpl(parts.concat(Array(count).map(() => part)));

  return {
    work: (count: number) => add(WORK, count),
    carry: (count: number) => add(CARRY, count),
    move: (count: number) => add(MOVE, count),
    tough: (count: number) => add(TOUGH, count),
    attack: (count: number) => add(ATTACK, count),
    rangedAttack: (count: number) => add(RANGED_ATTACK, count),
    heal: (count: number) => add(HEAL, count),
    claim: (count: number) => add(CLAIM, count),
    finalise: () => parts,
  };
};

export const bodyBuilder = () => bodyImpl([]);
