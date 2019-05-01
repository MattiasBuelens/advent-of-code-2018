import * as fs from 'fs';
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
    let result = evaluateProgram(program, {ip: 0, registers: [0, 0, 0, 0, 0, 0]});
    return result.registers[0];
}
