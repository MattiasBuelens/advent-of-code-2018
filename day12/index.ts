import * as fs from 'fs';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

type Pot = '.' | '#';

interface Rule {
    inputs: Pot[];
    output: Pot;
}

interface State {
    pots: Pot[];
    zeroIndex: number;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const initialState = lines[0].match(/^initial state: ([.#]+)$/)![1].split('') as Pot[];
    const rules: Rule[] = lines
        .slice(2)
        .map(line => {
            const [, inputs, output] = line.match(/^([.#]{5}) => ([.#])$/)!;
            return {inputs: inputs.split('') as Pot[], output: output as Pot};
        });

    part1(initialState, rules);
    part2(initialState, rules);

})();

function part1(initialPots: Pot[], rules: Rule[]) {
    let state = {pots: initialPots, zeroIndex: 0};
    if (DEBUG) {
        console.log('State 0:');
        printState(state);
    }
    for (let iteration = 1; iteration <= 20; iteration++) {
        state = iterate(rules, state);
    }
    const score = getPlantIndices(state.pots).reduce((sum, index) => sum + (index - state.zeroIndex));
    console.log(`Answer to part 1: ${score}`);
}

function part2(initialPots: Pot[], rules: Rule[]) {
    let state = {pots: initialPots, zeroIndex: 0};

    // After a certain number of steps, the plant spread enters a pattern
    // From then on, in every step, all plants simply move one pot to the right

    // Find start of pattern
    let prevState = state;
    let iteration = 0;
    do {
        prevState = state;
        state = iterate(rules, state);
        iteration++;
    } while (state.pots.join('') !== ('.' + prevState.pots.join('')));

    if (DEBUG) {
        console.log(`State ${iteration - 1}:`);
        printState(prevState);
        console.log(`State ${iteration}:`);
        printState(state);
    }

    console.assert(state.zeroIndex === 0);
    const plants = getPlantIndices(state.pots);
    let score = plants.reduce((sum, index) => sum + index);

    // In every next step, all plants move one pot to the right
    // For every moved plant, the score increases by one
    score += (50_000_000_000 - iteration) * plants.length;

    console.log(`Answer to part 2: ${score}`);
}

function iterate(rules: Rule[], {pots, zeroIndex}: State): State {
    // Can have at most two new plants on either end
    pots = ['.', '.', ...pots, '.', '.'];
    zeroIndex += 2;
    // Compute next state
    let newPots: Pot[] = Array(pots.length);
    for (let i = 0; i < pots.length; i++) {
        for (let rule of rules) {
            if (matchesRuleAt(rule, pots, i)) {
                newPots[i] = rule.output;
                break;
            }
        }
        if (DEBUG) {
            console.assert(newPots[i] !== undefined, 'No matching rule!');
        }
    }
    // Optimization: trim empty plants on either end, but preserve pot at zero index
    let leftMostPlant = 0;
    while (newPots[leftMostPlant] === '.' && leftMostPlant < zeroIndex) {
        leftMostPlant++;
    }
    let rightMostPlant = newPots.length - 1;
    while (newPots[rightMostPlant] === '.' && rightMostPlant > zeroIndex) {
        rightMostPlant--;
    }
    newPots = newPots.slice(leftMostPlant, rightMostPlant + 1);
    let newZeroIndex = zeroIndex - leftMostPlant;
    return {
        pots: newPots,
        zeroIndex: newZeroIndex
    }
}

function matchesRuleAt(rule: Rule, pots: Pot[], index: number): boolean {
    const {inputs} = rule;
    for (let j = 0; j < 5; j++) {
        let pot = pots[index + j - 2];
        if (inputs[j] === '#' && pot !== '#') {
            return false;
        }
        if (inputs[j] === '.' && pot === '#') {
            return false;
        }
    }
    return true;
}

function getPlantIndices(pots: Pot[]): number[] {
    let indices = [];
    for (let i = 0; i < pots.length; i++) {
        if (pots[i] === '#') {
            indices.push(i);
        }
    }
    return indices;
}

function printState(state: State) {
    console.log(state.pots.join(''));
    console.log((' ').repeat(state.zeroIndex) + '^');
}
