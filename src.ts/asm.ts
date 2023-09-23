// [ OPCODE, inputs = 0, outputs = 0, effectDepth = inputs ];
const ops = {
    // STOP and Arithmentic Operations
    stop: [ 0 ],
    add: [ 1, 2, 1 ],
    mul: [ 2, 2, 1 ],
    sub: [ 3, 2, 1 ],
    div: [ 4, 2, 1 ],
    sdiv: [ 5, 2, 1 ],
    mod: [ 6, 2, 1 ],
    smod: [ 7, 2, 1 ],
    addmod: [ 8, 3, 1 ],
    mulmod: [ 9, 3, 1 ],
    exp: [ 10, 2, 1 ],
    signextend: [ 11, 2, 1 ],

    // Comparison and Bitwise Logic Operations
    lt: [ 0x10, 2, 1 ],
    gt: [ 0x11, 2, 1 ],
    slt: [ 0x12, 2, 1 ],
    sgt: [ 0x13, 2, 1 ],
    eq: [ 0x14, 2, 1 ],
    iszero: [ 0x15, 1, 1 ],
    and: [ 0x16, 2, 1 ],
    or: [ 0x17, 2, 1 ],
    xor: [ 0x18, 2, 1 ],
    not: [ 0x19, 1, 1 ],
    byte: [ 0x1a, 2, 1 ],
    shl: [ 0x1b, 2, 1 ],
    shr: [ 0x1c, 2, 1 ],
    sar: [ 0x1d, 2, 1 ],

    // Keccak256
    keccak256: [ 0x20, 2, 1 ],

    // Environmental Information
    address: [ 0x30, 0, 1 ],
    balance: [ 0x31, 1, 1 ],
    origin: [ 0x32, 0, 1 ],
    caller: [ 0x33, 0, 1 ],
    callvalue: [ 0x34, 0, 1 ],
    calldataload: [ 0x35, 1, 1 ],
    calldatasize: [ 0x36, 0, 1 ],
    calldatacopy: [ 0x37, 3],
    codesize: [ 0x38, 0, 1 ],
    codecopy: [ 0x39, 3],
    gasprice: [ 0x3a, 0, 1 ],
    extcodesize: [ 0x3b, 1, 1 ],
    extcodecopy: [ 0x3c, 4, 0 ],
    returndatasize: [ 0x3d, 0, 1 ],
    returndatacopy: [ 0x3e, 3],
    extcodehash: [ 0x3f, 1, 1 ],

    // Block Information
    blockhash: [ 0x40, 1, 1 ],
    coinbase: [ 0x41, 0, 1 ],
    timestamp: [ 0x42, 0, 1 ],
    number: [ 0x43, 0, 1 ],
    difficulty: [ 0x44, 0, 1 ],
    gaslimit: [ 0x45, 0, 1 ],
    chainid: [ 0x46, 0, 1 ],
    selfbalance: [ 0x47, 0, 1 ],

    // Stack, Memory, Storage and Fow Operations
    pop: [ 0x50, 1, 0],
    mload: [ 0x51, 1, 1],
    mstore: [ 0x52, 2, 0],
    mstore8: [ 0x53, 2, 0],
    sload: [ 0x54, 1, 1],
    sstore: [ 0x55, 2, 0],
    jump: [ 0x56, 1, 0],
    jumpi: [ 0x57, 2, 0],
    pc: [ 0x58, 0, 1],
    msize: [ 0x59, 0, 1],
    gas: [ 0x5a, 0, 1],
    jumpdest: [ 0x5b, 0, 0],

    // System Operations
    create: [ 0xf0, 3, 1 ],
    call: [ 0xf1, 7, 1 ],
    callcode: [ 0xf2, 7, 1 ],
    "return": [ 0xf3, 2, 0 ],
    delegatecall: [ 0xf4, 6, 1 ],
    create2: [ 0xf5, 4, 1 ],
    staticcall: [ 0xfa, 6, 1 ],
    revert: [ 0xfd, 2, 0 ],
    invalid: [ 0xfe, 0, 0 ],
    selfdestruct: [ 0xff, 1, 0 ],
};

for (let i = 0; i < 32; i++) {
    ops[`push${ i + 1 }`] = [ 0x60 + i, 0, 1 ];
}

for (let i = 0; i < 16; i++) {
    ops[`dup${ i + 1 }`] = [ 0x80 + i, 1, 2, i + 2 ];
    ops[`swap${ i + 1 }`] = [ 0x90 + i, 0, 0, i + 2 ];
}

for (let i = 0; i < 5; i++) {
    ops[`log${ i + 1 }`] = [ 0xa0 + i, 2 + i, 0 ];
}

interface Op {
    mnemonic: string;
    opcode: number;
    inputs: number;
    outputs: number;
    effectDepth: number;
}

function getOp(mnemonic: string):  {
    const info = ops[mnemonic];
    if (info == null) { throw new Error(`unknown OPCODE mnemonic`); }
/*
    const pushSize = mnemonic.match(/^push[0-9]+$/);

    if (pushSize) {
        const count = parseInt(pushSize);
        i
    }
*/
    return {
        mnemonic,
        opcode: info[0],
        inputs: info[1] || 0,
        outputs: info[2] || 0,
        effectDepth: (info[3] != null) ? info[3]: (info[1] || 0)
    };
}

function checkLabel(label: string): string {
    if (!label.match(/^[a-z][a-z0-9]*$/)) {
        throw new Error(`invalid label: ${ JSON.stringify(label) }`);
    }
    return label;
}

export class AsmBuilder {

    ops(): void {
    }

    get bytecode(): string {
        return "0x";
    }

    get code(): string {
        return "";
    }
}
