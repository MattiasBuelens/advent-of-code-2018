import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

function getLetterCounts(word: string): Map<string, number> {
    const counts = new Map<string, number>();
    for (let letter of word) {
        counts.set(letter, (counts.has(letter) ? counts.get(letter)! : 0) + 1);
    }
    return counts;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    let numberOfIdsContainingALetterTwice = 0;
    let numberOfIdsContainingALetterThrice = 0;
    for (let id of input.trim().split('\n')) {
        const counts = new Set<number>(getLetterCounts(id).values());
        if (counts.has(2)) {
            numberOfIdsContainingALetterTwice += 1;
        }
        if (counts.has(3)) {
            numberOfIdsContainingALetterThrice += 1;
        }
    }
    console.log(numberOfIdsContainingALetterTwice * numberOfIdsContainingALetterThrice);
})();
