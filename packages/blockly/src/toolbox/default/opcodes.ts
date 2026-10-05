const OPCODES = {
    forward: 'motion.forward',
    moveTo: 'motion.moveTo',
    number: 'math.number',
} as const;

type TOPCODES_VALUE = (typeof OPCODES)[keyof typeof OPCODES];

export { OPCODES, type TOPCODES_VALUE };
