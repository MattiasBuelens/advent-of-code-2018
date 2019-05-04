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
            assertRegister(registers.length, a);
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

function evaluateProgram({ipRegister, instructions}: Readonly<Program>, initialState: Readonly<State>): State {
    let ip = initialState.ip;
    let registers = [...initialState.registers] as RegisterState;
    while (ip >= 0 && ip < instructions.length) {
        registers[ipRegister] = ip;
        registers = evaluateInstruction(registers, instructions[ip]);
        ip = registers[ipRegister];
        ip++;
    }
    return {ip, registers};
}

function part1(program: Program) {
    // At IP = 28, the program checks whether the computed R1 matches the input R0 (eqrr 1 0 5).
    // If it does, it exits the program, otherwise it jumps back to the top of the loop to compute a new R1.
    // We replace that instruction with a jump to the end, so we can dump the first value of R1.
    const index = 28;
    const modifiedProgram: Program = {
        ipRegister: program.ipRegister,
        instructions: [
            ...program.instructions.slice(0, index),
            {op: Operation.SET_IMMEDIATE, a: program.instructions.length, b: 0, c: program.ipRegister},
            ...program.instructions.slice(index + 1)
        ]
    };
    const result = evaluateProgram(modifiedProgram, {ip: 0, registers: [0, 0, 0, 0, 0, 0]});

    // If we were run the original program with R0 set to this found value for R1, the check would succeed
    // on the very first iteration. Therefore, this is the value that will cause the program to halt
    // after executing the fewest instructions.
    return result.registers[1];
}

function part2({ipRegister, instructions}: Readonly<Program>): number {
    let ip = 0;
    let registers = [0, 0, 0, 0, 0, 0] as RegisterState;
    const values = new Set<number>();
    while (ip >= 0 && ip < instructions.length) {
        if (ip === 28) {
            if (values.has(registers[1])) {
                // Found a loop!
                // Return the last value
                return [...values][values.size - 1];
            } else {
                values.add(registers[1]);
            }
        }
        registers[ipRegister] = ip;
        registers = evaluateInstruction(registers, instructions[ip]);
        if (ip === 17) {
            /*
              Lines 17 to 25 decompile to:
              ```
              let r5 = 0;
              while (((r5 + 1) * 256) <= r2) {
                r5++;
              }
              ```

              The loop stops when:
              ```
              ((r5 + 1) * 256) > r2
              r5 + 1 > floor(r2 / 256)
              r5 > floor(r2 / 256) - 1
              r5 >= floor(r2 / 256)
              ```

              Optimize the loop by immediately setting R5 to the right-hand side.
            */
            registers[5] = Math.floor(registers[2] / 256);
        }
        if (ip === 23) {
            // When the above optimization is turned off,
            // this sanity check should succeed when the loop exits at line 23.
            assert.strictEqual(registers[5], Math.floor(registers[2] / 256));
        }
        ip = registers[ipRegister];
        ip++;
    }
    return -1;
}
