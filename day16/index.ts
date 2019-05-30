import * as fs from 'fs';
import {promisify} from 'util';
import {DEBUG} from '../debug';

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

const OPERATIONS: Operation[] = [
    Operation.ADD_REGISTER,
    Operation.ADD_IMMEDIATE,
    Operation.MULTIPLY_REGISTER,
    Operation.MULTIPLY_IMMEDIATE,
    Operation.AND_REGISTER,
    Operation.AND_IMMEDIATE,
    Operation.OR_REGISTER,
    Operation.OR_IMMEDIATE,
    Operation.SET_REGISTER,
    Operation.SET_IMMEDIATE,
    Operation.GREATER_THAN_IMMEDIATE_REGISTER,
    Operation.GREATER_THAN_REGISTER_IMMEDIATE,
    Operation.GREATER_THAN_REGISTER_REGISTER,
    Operation.EQUAL_IMMEDIATE_REGISTER,
    Operation.EQUAL_REGISTER_IMMEDIATE,
    Operation.EQUAL_REGISTER_REGISTER
];

interface Instruction {
    op: Operation;
    a: number;
    b: number;
    c: number;
}

interface UnknownInstruction {
    opcode: number;
    a: number;
    b: number;
    c: number;
}

type State = [number, number, number, number];

interface Sample {
    before: Readonly<State>;
    instruction: UnknownInstruction;
    after: Readonly<State>;
}

type Program = Instruction[];
type UnknownProgram = UnknownInstruction[];

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const [samples, program] = parse(lines);

    const answer1 = part1(samples);
    console.log(`Answer to part 1: ${answer1}`);

    const answer2 = part2(samples, program);
    console.log(`Answer to part 2: ${answer2}`);
})();

function parse(lines: string[]): [Sample[], UnknownProgram] {
    const samples: Sample[] = [];
    let i = 0;
    while (i < lines.length && lines[i] != '') {
        samples.push(parseSample(lines[i], lines[i + 1], lines[i + 2]));
        i += 4;
    }
    i += 2;
    const program: UnknownProgram = [];
    while (i < lines.length) {
        program.push(parseInstruction(lines[i]));
        i++;
    }
    return [samples, program];
}

function parseSample(beforeLine: string, opLine: string, afterLine: string): Sample {
    const before = JSON.parse(beforeLine.replace('Before: ', '')) as State;
    const after = JSON.parse(afterLine.replace('After: ', '')) as State;
    const instruction = parseInstruction(opLine);
    return {before, instruction, after};
}

function parseInstruction(line: string): UnknownInstruction {
    const [op, a, b, c] = line.split(' ').map(Number);
    return {opcode: op, a, b, c};
}

class RegisterError extends RangeError {
}

function assertRegister(length: number, index: number): void {
    if (!(0 <= index && index < length)) {
        throw new RegisterError(`Register index out of bounds: ${index} not in [0, ${length}[`);
    }
}

function evaluateInstruction(state: Readonly<State>, {op, a, b, c}: Instruction): State {
    const newState = [...state] as State;
    assertRegister(state.length, c);
    switch (op) {
        case Operation.ADD_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = state[a] + state[b];
            break;
        case Operation.ADD_IMMEDIATE:
            assertRegister(state.length, a);
            newState[c] = state[a] + b;
            break;
        case Operation.MULTIPLY_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = state[a] * state[b];
            break;
        case Operation.MULTIPLY_IMMEDIATE:
            assertRegister(state.length, a);
            newState[c] = state[a] * b;
            break;
        case Operation.AND_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = state[a] & state[b];
            break;
        case Operation.AND_IMMEDIATE:
            assertRegister(state.length, a);
            newState[c] = state[a] & b;
            break;
        case Operation.OR_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = state[a] | state[b];
            break;
        case Operation.OR_IMMEDIATE:
            assertRegister(state.length, a);
            newState[c] = state[a] | b;
            break;
        case Operation.SET_REGISTER:
            assertRegister(state.length, a);
            newState[c] = state[a];
            break;
        case Operation.SET_IMMEDIATE:
            newState[c] = a;
            break;
        case Operation.GREATER_THAN_IMMEDIATE_REGISTER:
            assertRegister(state.length, b);
            newState[c] = (a > state[b]) ? 1 : 0;
            break;
        case Operation.GREATER_THAN_REGISTER_IMMEDIATE:
            assertRegister(state.length, a);
            newState[c] = (state[a] > b) ? 1 : 0;
            break;
        case Operation.GREATER_THAN_REGISTER_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = (state[a] > state[b]) ? 1 : 0;
            break;
        case Operation.EQUAL_IMMEDIATE_REGISTER:
            assertRegister(state.length, b);
            newState[c] = (a === state[b]) ? 1 : 0;
            break;
        case Operation.EQUAL_REGISTER_IMMEDIATE:
            assertRegister(state.length, b);
            newState[c] = (state[a] === b) ? 1 : 0;
            break;
        case Operation.EQUAL_REGISTER_REGISTER:
            assertRegister(state.length, a);
            assertRegister(state.length, b);
            newState[c] = (state[a] === state[b]) ? 1 : 0;
            break;
    }
    return newState;
}

function arrayEquals<T>(array1: readonly T[], array2: readonly T[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }
    return true;
}

function getPossibleOperations({before, instruction: {a, b, c}, after}: Sample): Set<Operation> {
    let operations = new Set<Operation>();
    for (let op of OPERATIONS) {
        try {
            const newState = evaluateInstruction(before, {op, a, b, c});
            if (arrayEquals(after, newState)) {
                operations.add(op);
            }
        } catch (e) {
            if (e instanceof RegisterError) {
                // invalid register for instruction
                continue;
            }
            throw e;
        }
    }
    return operations;
}

function part1(samples: Sample[]) {
    let threeOrMoreOperations = 0;
    for (let sample of samples) {
        if (getPossibleOperations(sample).size >= 3) {
            threeOrMoreOperations++;
        }
    }
    return threeOrMoreOperations;
}

function first<T>(collection: Iterable<T>): T | undefined {
    const {done, value} = collection[Symbol.iterator]().next();
    return done ? undefined : value;
}

function findOpcodes(samples: Sample[]): Operation[] {
    // Table of every opcode to all remaining possible operations
    const table = new Map<number, Set<Operation>>();
    for (let i = 0; i < 16; i++) {
        table.set(i, new Set(OPERATIONS));
    }
    for (let sample of samples) {
        const opcode = sample.instruction.opcode;
        const possibleOperations = table.get(opcode)!;
        const possibleOperationsForSample = getPossibleOperations(sample);
        // Remove all operations that do not fit this sample
        for (let operation of possibleOperations) {
            if (!possibleOperationsForSample.has(operation)) {
                possibleOperations.delete(operation);
            }
        }
        // Check remaining possible operations
        if (possibleOperations.size === 0) {
            throw new Error(`No possible operations left for opcode ${opcode}`);
        }
        if (possibleOperations.size === 1) {
            // Found a single remaining operation!
            // Remove it as possible operation from all other opcodes
            const foundOperation = first(possibleOperations)!;
            for (let [otherOpcode, otherOperations] of table) {
                if (opcode !== otherOpcode) {
                    otherOperations.delete(foundOperation);
                }
            }
        }
    }
    // Collect found operations
    const result: Operation[] = [];
    for (let [opcode, operations] of table) {
        if (operations.size !== 1) {
            throw new Error(`Multiple possible operations left for opcode ${opcode}`);
        }
        result[opcode] = first(operations)!;
    }
    return result;
}

function mapProgram(unknownProgram: UnknownProgram, mapping: Operation[]): Program {
    return unknownProgram.map(({opcode, a, b, c}) => ({op: mapping[opcode], a, b, c}));
}

function part2(samples: Sample[], unknownProgram: UnknownProgram): number {
    const mapping = findOpcodes(samples);
    if (DEBUG) {
        console.log('Mapping:', mapping);
    }
    const program: Program = mapProgram(unknownProgram, mapping);
    let state: State = [0, 0, 0, 0];
    for (const instruction of program) {
        state = evaluateInstruction(state, instruction);
    }
    if (DEBUG) {
        console.log('Program state:', state);
    }
    return state[0];
}
