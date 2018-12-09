import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    console.log(`part1: ${part1(lines)}`);
    console.log(`part2: ${part2(lines)}`);
})();

function part1(lines: string[]): number {
    let result = 0;
    for (let line of lines) {
        result += parseInt(line, 10);
    }
    return result;
}

function part2(lines: string[]): number {
    const changes = lines.map(x => parseInt(x, 10));
    let frequency = 0;
    let seen = new Set<number>();
    while (true) {
        for (let change of changes) {
            frequency += change;
            if (seen.has(frequency)) {
                return frequency;
            } else {
                seen.add(frequency);
            }
        }
    }
}
