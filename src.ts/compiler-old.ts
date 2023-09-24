//import { parse } from "./parser.js";
import { getOp } from "./opcodes.js";
import { ethers } from "ethers";

const children: Record<string, Array<string>> = {
    Program: [ "statements" ],
    Return: [ "value" ],
    BinaryExpr: [ "right", "left" ],
};

/*
const OpMap: Record<string, string> = {
    "+": "add"
};
*/
/*
function pad(_value: number, length?: number, c?: string): string {
    if (length == null) { length = 2; }
    if (c == null) { c = "0"; }
    let value = _value.toString(16);
    if (value.length < 2) { value = c + value; }
    return value;
}
*/

type Literal = string | number;
type Op = { mnemonic: string, operands: Array<Literal | Op>, comment?: string };

type Bytes = { bytes: Array<number>, comment?: string };
type Label = { label: string };

function op(mnemonic: string, operands?: Array<Literal | Op>): Op {
    if (operands == null) { operands = [ ]; }

    const info = getOp(mnemonic);
    if (info.inputs !== operands.length) {
        throw new Error(`${ mnemonic } expects ${ info.inputs } inputs; got ${ operands.length }`);
    }
    // @TODO: check inputs
    return { mnemonic, operands };
}

function getPush(value: number, length?: number): Array<number> {
    const push = [ ];
    while (true) {
        push.unshift(value & 0xff);
        value >>= 8;
        if (value === 0) { break; }
    }
    if (length) {
        while (push.length < length) { push.unshift(0); }
    }
    push.unshift(0x60 + push.length - 1);
    return push;
}

class Output {
    readonly clumps: Array<Bytes | Op | Label>;

    constructor() {
        this.clumps = [ ];

        // Set the Stack Pointer
        this.ops(op("mstore", [ 0, 1120 ]));
        this.ops(op("jump", [ "$main" ]));

        // malloc(size)
        this.label("malloc");

        // compute mask
        this.ops(op("add", [ 3, "$$" ]));
        this.ops(op("shr", [ 2, "$$" ]));
        this.push(1);
        this.ops(op("swap1"));
        this.ops(op("shl", [ "$$", "$$" ]));
        this.push(1);
        this.ops(op("swap1"));
        this.ops(op("sub", [ "$$", "$$" ]));

        // Scan the free heap map for a free area big enough
        this.push(0);
        this.label("mallocScan");
        this.ops(op("dup2"));                 // [ mask, i, mask ]
        this.ops(op("dup2"));                 // [ mask, i, mask, i ]
//        this.ops(op("shl", [ "$$", "$$" ]);   // [ mask, i, (mask << i) ]
        this.ops(op("mload", [ 1088 ]));      // [ mask, i, (m << i), heapMap ]
        this.ops(op("dup2"));                 // [ mask, i, (m << i), hM, (m << i) ]
        this.ops(op("and", [ "$$", "$$"]));   // [ mask, i, (m << i), hM & (m << i) ]
        this.ops(op("eq", [ 0, "$$" ]));      // [ mask, i, (m << i), hm & (m << 1) == 0 ]
        this.ops(op("jumpi", [ "$mallocScan" ]))

        this.ops(op("mstore", [ 0, "$$" ]));
        
        this.ops(op("return", [ 0, op("msize", [ ]) ]));

        this.label("main");
        this.push(7);
        this.ops(op("jump", [ "$malloc" ]));
    }

    label(label: string): void {
        this.clumps.push({ label });
    }

    ops(op: Op): void {
       this.clumps.push(op);
    }

    push(value: number) {
        const bytes = getPush(value);
        this.clumps.push({ bytes });
    }

    doReturn(value?: any): void {
    }

    binaryOp(op: string): void {
        //this.bytes.push(OpMap[op]);
    }

    dump(): string {
        console.log(this);
        console.log(this.clumps);

        const labels: Record<string, number> = { };

        let bytes: Array<number | string> = [ ];
        const visit = (op: Bytes | Op | Label) => {
            if ("label" in op) {
                labels[op.label] = bytes.length;
                bytes.push(getOp("jumpdest").opcode);
            } else if ("bytes" in op) {
                for (let i = 0; i < op.bytes.length; i++) {
                    bytes.push(op.bytes[i]);
                }
            } else {
                for (let i = op.operands.length - 1; i >= 0; i--) {
                    const operand = op.operands[i];
                    if (typeof(operand) === "string") {
                        if (operand === "$$") {
                        } else {
                            [ operand, 0, 0, 0 ].forEach(b => bytes.push(b));
                        }
                    } else if (typeof(operand) === "number") {
                        getPush(operand).forEach((b) => { bytes.push(b); });
                    } else {
                        visit(operand);
                    }
                }
                bytes.push(getOp(op.mnemonic).opcode);
            }
        }

        for (const clump of this.clumps) {
            visit(clump);
        }

        for (let i = 0; i < bytes.length; i++) {
            const byte = bytes[i];
            if (typeof(byte) === "string") {
                const offset = labels[byte.substring(1)];
                if (offset == null) { throw new Error(`unknown lable: ${ byte }`); }
                const push = getPush(offset, 3);
                console.log(push, i, byte);
                push.forEach((b, index) => { bytes[i + index] = b; });
            }
        }

        console.log(bytes.map(a => a.toString(16)), labels);

        return Buffer.from(<Array<number>>bytes).toString("hex")
    }
}

type VisitFunc = (output: Output, node: any, parent: any) => void;

const visitor: Record<string, { enter?: VisitFunc, exit?: VisitFunc }> = {
  BinaryExpr: {
    enter: (node: any, parent: any) => {
    },
    exit: (output, node, parent) => {
        output.binaryOp(node.op);
    }
  },
  Literal: {
    enter: (node: any, parent: any) => {
    },
    exit: (output, node, parent) => {
       //output.literal(node.value);
    },
  },
  Return: {
    exit: (output, node, parent) => {
        output.doReturn(node.value);
    },
  }
};

function getTag(name: string): string {
    return name.split("-").map((n) => {
        return n.substring(0, 1).toUpperCase() + n.substring(1).toLowerCase();
    }).join("");
}

export function codegen(ast: any) {
    const output = new Output();
    const visit = (node: any, parent: any) => {
        const tag = getTag(node.type);
        const gen = visitor[tag];
        if (gen && gen.enter) {
            gen.enter(output, node, parent);
        } else {
            console.log(`Skipped: ${ tag }.enter`);
        }
        for (const childKey of (children[tag] || [ ])) {
            const childs = (node[childKey] || [ ]);
            if (Array.isArray(childs)) {
                for (const child of childs) {
                    visit(child, node);
                }
            } else {
                visit(childs, node);
            }
        }
        if (gen && gen.exit) {
            gen.exit(output, node, parent);
        } else {
            console.log(`Skipped: ${ tag }.exit`);
        }
    };
    visit(ast, null);

    output.dump();
}

/*
const ast = parse(`
return 4 + 5;
`);

codegen(ast);
*/

const bytecode = "0x" + (new Output()).dump();
console.log(bytecode);
(async function() {
  const provider = new ethers.JsonRpcProvider("http:/\/localhost:8545");
  console.log(await provider.call({ data: bytecode }));
})();
