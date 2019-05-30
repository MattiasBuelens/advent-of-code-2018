import * as fs from 'fs';
import {promisify} from 'util';
import {DEBUG} from '../debug';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');

    console.log(`part1: ${part1(lines)}`);
    console.log(`part2: ${part2(lines)}`);
})();

function getLetterCounts(word: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (let letter of word) {
        counts.set(letter, (counts.has(letter) ? counts.get(letter)! : 0) + 1);
    }
    return counts;
}

function part1(ids: string[]): number {
    let numberOfIdsContainingALetterTwice = 0;
    let numberOfIdsContainingALetterThrice = 0;
    for (let id of ids) {
        const counts = new Set<number>(getLetterCounts(id).values());
        if (counts.has(2)) {
            numberOfIdsContainingALetterTwice += 1;
        }
        if (counts.has(3)) {
            numberOfIdsContainingALetterThrice += 1;
        }
    }
    return numberOfIdsContainingALetterTwice * numberOfIdsContainingALetterThrice;
}

function part2(ids: string[]): string {
    for (let i = 0; i < ids.length; i++) {
        const id1 = ids[i];
        for (let j = i + 1; j < ids.length; j++) {
            const id2 = ids[j];
            let differences = 0;
            for (let k = 0; k < id1.length && differences <= 1; k++) {
                if (id1[k] !== id2[k]) {
                    differences += 1;
                }
            }
            if (differences === 1) {
                for (let k = 0; k < id1.length; k++) {
                    if (id1[k] !== id2[k]) {
                        const common = id1.slice(0, k) + id1.slice(k + 1);
                        if (DEBUG) {
                            console.log({id1, id2, common});
                        }
                        return common;
                    }
                }
            }
        }
    }
    throw new Error('No match');
}
