import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const polymer = input.trim();

    part1(polymer);
    part2(polymer);
})();

function part1(polymer: string) {
    const units = polymer.split('');
    let reacted = react(units);

    console.log(`Fully reacted polymer: ${reacted.join('')}`);
    console.log(`Answer to part 1: ${reacted.length}`);
}

function part2(polymer: string) {
    const units = polymer.split('');

    let bestUnitToRemove = '';
    let bestReacted = units;
    for (let i = 0; i < 26; i++) {
        let unitToRemove = String.fromCharCode('a'.charCodeAt(0) + i);
        const stripped = units.filter(unit => unit.toLowerCase() !== unitToRemove);
        const reacted = react(stripped);
        if (reacted.length < bestReacted.length) {
            bestUnitToRemove = unitToRemove;
            bestReacted = reacted;
        }
    }

    console.log(`Best unit to remove: ${bestUnitToRemove}`);
    console.log(`Reacted polymer after best unit is removed: ${bestReacted.join('')}`);
    console.log(`Answer to part 2: ${bestReacted.length}`);
}

function react(units: string[]): string[] {
    units = units.slice();
    for (let i = units.length - 2; i >= 0; i--) {
        const left = units[i];
        const right = units[i + 1];
        // aA or Ab
        if ((left === left.toLowerCase() && right === left.toUpperCase())
            || (left === left.toUpperCase() && right === left.toLowerCase())) {
            // React!
            units.splice(i, 2);
            // In the general case, we only move back one (with the loop decrement),
            // so we can immediately trigger "chain reactions".
            // However, if we reach the end of the polymer, there can't be any more chain reactions
            // and we should move back two in total.
            if (i === units.length) {
                i--;
            }
        }
    }
    return units;
}
