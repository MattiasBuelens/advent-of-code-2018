import * as fs from 'fs';
import * as assert from 'assert';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

const enum Operation {
    ADD_REGISTER = 'addr',
    ADD_IMMEDIATE = 'addi',
    MULTIPLY_REGISTER = 'mulr',
    MULTIPLY_IMMEDIATE = 'muli',
    AND_REGISTER = 'banr',
    AND_IMMEDIATE = 'bani',
    OR_REGISTER = 'borr',
    OR_IMMEDIATE = 'bori',
    SET_REGISTER = 'setr',
    SET_IMMEDIATE = 'seti',
    GREATER_THAN_IMMEDIATE_REGISTER = 'gtir',
    GREATER_THAN_REGISTER_IMMEDIATE = 'gtri',
    GREATER_THAN_REGISTER_REGISTER = 'gtrr',
    EQUAL_IMMEDIATE_REGISTER = 'eqir',
    EQUAL_REGISTER_IMMEDIATE = 'eqri',
    EQUAL_REGISTER_REGISTER = 'eqrr'
}

interface Instruction {
    op: Operation;
    a: number;
    b: number;
    c: number;
}

type RegisterState = [number, number, number, number, number, number];

interface State {
    ip: number;
    registers: RegisterState;
}

interface Program {
    ipRegister: number;
    instructions: Instruction[];
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const program = parse(lines);

    const answer1 = part1(program);
    console.log(`Answer to part 1: ${answer1}`);

    const answer2 = part2(program);
    console.log(`Answer to part 2: ${answer2}`);
})();

function parse(lines: string[]): Program {
    let [, ipString] = lines[0].match(/^#ip ([0-5])$/)!;
    const ipRegister = Number(ipString);

    const instructions: Instruction[] = [];
    for (let i = 1; i < lines.length; i++) {
        instructions.push(parseInstruction(lines[i]));
    }

    return {ipRegister, instructions};
}

function parseInstruction(line: string): Instruction {
    const [op, a, b, c] = line.split(' ');
    return {
        op: op as Operation,
        a: Number(a),
        b: Number(b),
        c: Number(c)
    };
}

class RegisterError extends RangeError {
}

function assertRegister(length: number, index: number): void {
    if (!(0 <= index && index < length)) {
        throw new RegisterError(`Register index out of bounds: ${index} not in [0, ${length}[`);
    }
}

function evaluateInstruction(registers: Readonly<RegisterState>, {op, a, b, c}: Instruction): RegisterState {
    const newRegisters = [...registers] as RegisterState;
    assertRegister(registers.length, c);
    switch (op) {
        case Operation.ADD_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = registers[a] + registers[b];
            break;
        case Operation.ADD_IMMEDIATE:
            assertRegister(registers.length, a);
            newRegisters[c] = registers[a] + b;
            break;
        case Operation.MULTIPLY_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = registers[a] * registers[b];
            break;
        case Operation.MULTIPLY_IMMEDIATE:
            assertRegister(registers.length, a);
            newRegisters[c] = registers[a] * b;
            break;
        case Operation.AND_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = registers[a] & registers[b];
            break;
        case Operation.AND_IMMEDIATE:
            assertRegister(registers.length, a);
            newRegisters[c] = registers[a] & b;
            break;
        case Operation.OR_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = registers[a] | registers[b];
            break;
        case Operation.OR_IMMEDIATE:
            assertRegister(registers.length, a);
            newRegisters[c] = registers[a] | b;
            break;
        case Operation.SET_REGISTER:
            assertRegister(registers.length, a);
            newRegisters[c] = registers[a];
            break;
        case Operation.SET_IMMEDIATE:
            newRegisters[c] = a;
            break;
        case Operation.GREATER_THAN_IMMEDIATE_REGISTER:
            assertRegister(registers.length, b);
            newRegisters[c] = (a > registers[b]) ? 1 : 0;
            break;
        case Operation.GREATER_THAN_REGISTER_IMMEDIATE:
            assertRegister(registers.length, a);
            newRegisters[c] = (registers[a] > b) ? 1 : 0;
            break;
        case Operation.GREATER_THAN_REGISTER_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = (registers[a] > registers[b]) ? 1 : 0;
            break;
        case Operation.EQUAL_IMMEDIATE_REGISTER:
            assertRegister(registers.length, b);
            newRegisters[c] = (a === registers[b]) ? 1 : 0;
            break;
        case Operation.EQUAL_REGISTER_IMMEDIATE:
            assertRegister(registers.length, b);
            newRegisters[c] = (registers[a] === b) ? 1 : 0;
            break;
        case Operation.EQUAL_REGISTER_REGISTER:
            assertRegister(registers.length, a);
            assertRegister(registers.length, b);
            newRegisters[c] = (registers[a] === registers[b]) ? 1 : 0;
            break;
    }
    return newRegisters;
}

/*

The first few instructions are:
```
addi 3 16 3
seti 1 3 4
seti 1 8 5
mulr 4 5 1
eqrr 1 2 1
addr 1 3 3
addi 3 1 3
addr 4 0 0
addi 5 1 5
gtrr 5 2 1
addr 3 1 3
seti 2 6 3
```

This decompiles to:
```
00: IP = IP + 16;   // jump to 0+16+1=17 (skip the loop if R3 starts at 0)
01: r4 = r1 + 3;    // r4 = 0 + 3 = 3
02: r5 = r1 + 8;    // r5 = 0 + 8 = 8
03: r1 = r4 * r5;   // top of the loop
04: r1 = r1 == r2;
05: IP = r1 + IP;   // if (r4 * r5) == r2, jump to 5+1+1=7, else jump to 5+0+1=6
06: IP = IP + 1;    // jump to 6+1+1 = 8
07: r0 = r4 + r0;   // r0 += r4
08: r5 = r5 + 1;    // r5 += 1
09: r1 = r5 > r2;
10: IP = IP + r1;   // if (r5 > r2), jump to 10+1+1=12, else jump to 10+0+1=11
11: r3 = 2;         // jump to 2+1=3 (top of the loop)
```

Written as JavaScript:
```
do {
 if ((r4 * r5) == r2) {
   r0 += r4;
 }
 r5 += 1;
} while (!(r5 > r2));
```

We don't change r2 or r4 in the loop body, so the only way that (r4 * r5) == r2 can happen is when:
* r2 % r4 == 0 (otherwise r2 cannot be a multiple of r4)
* r5 = r2 / r4

The code is equivalent to:
```
if (r2 % r4 == 0) {
  r0 += r4;
}
r5 = r2 + 1;
```

*/
function evaluateProgram({ipRegister, instructions}: Readonly<Program>, initialState: Readonly<State>): State {
    let ip = initialState.ip;
    let registers = [...initialState.registers] as RegisterState;
    let t = 0;
    let enterRegisters: RegisterState | undefined;
    while (ip >= 0 && ip < instructions.length) {
        if (DEBUG && ip === 2) {
            // entering loop
            enterRegisters = registers;
        }
        registers[ipRegister] = ip;
        registers = evaluateInstruction(registers, instructions[ip]);
        if (ip === 9 && registers[1] === 0) {
            // The loop condition (gtrr 5 2 1) returned 0, so we're about to re-enter the loop
            // Fix it up so we immediately exit the loop instead!
            if ((registers[4] * (registers[5] - 1) !== registers[2]) && registers[2] % registers[4] === 0) {
                registers[0] += registers[4];
            }
            registers[5] = registers[2] + 1;
            // Re-evaluate the loop condition
            registers[ipRegister] = ip;
            registers = evaluateInstruction(registers, instructions[ip]);
            if (registers[1] === 0) {
                throw new Error('Optimization failed!');
            }
        }
        if (DEBUG && ip === 9 && registers[1] === 1) {
            // exiting loop
            assert.ok(registers[5] === registers[2] + 1);
            assert.ok(registers[0] === enterRegisters![0] + (registers[2] % registers[4] === 0 ? registers[4] : 0));
            enterRegisters = undefined;
        }
        ip = registers[ipRegister];
        ip++;
        t++;
    }
    return {ip, registers};
}

function part1(program: Program) {
    let result = evaluateProgram(program, {ip: 0, registers: [0, 0, 0, 0, 0, 0]});
    return result.registers[0];
}

function part2(program: Program) {
    let result = evaluateProgram(program, {ip: 0, registers: [1, 0, 0, 0, 0, 0]});
    return result.registers[0];
}
