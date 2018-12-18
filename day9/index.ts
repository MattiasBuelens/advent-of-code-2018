import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const [, ...groups] = input.match(/(\d+) players; last marble is worth (\d+) points/)!;
    const [nbPlayers, lastMarble] = groups.map(x => parseInt(x, 10));

    part1(nbPlayers, lastMarble);
    part2(nbPlayers, lastMarble);
})();

interface Marble {
    value: number;
    prev: Marble;
    next: Marble;
}

function part1(nbPlayers: number, lastMarble: number) {
    const score = solve(nbPlayers, lastMarble);
    console.log(`Answer to part 1: ${score}`);
}

function part2(nbPlayers: number, lastMarble: number) {
    const score = solve(nbPlayers, lastMarble * 100);
    console.log(`Answer to part 2: ${score}`);
}

function solve(nbPlayers: number, lastMarble: number): number {
    const scores = new Array<number>(nbPlayers).fill(0);

    let currentMarble: Marble = {value: 0, prev: undefined!, next: undefined!};
    currentMarble.prev = currentMarble.next = currentMarble;

    let currentPlayer = 0;
    for (let newValue = 1; newValue <= lastMarble; newValue++) {
        if (newValue % 23 === 0) {
            for (let i = 1; i < 7; i++) {
                currentMarble = currentMarble.prev;
            }
            const removedMarble = currentMarble.prev;
            removedMarble.prev.next = currentMarble;
            currentMarble.prev = removedMarble.prev;
            scores[currentPlayer] += newValue + removedMarble.value;
        } else {
            const prev = currentMarble.next;
            const next = currentMarble.next.next;
            currentMarble = {value: newValue, prev, next};
            prev.next = currentMarble;
            next.prev = currentMarble;
        }
        currentPlayer = (currentPlayer + 1) % nbPlayers;
    }

    return Math.max(...scores);
}
