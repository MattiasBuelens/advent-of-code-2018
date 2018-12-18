import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const [, ...groups] = input.match(/(\d+) players; last marble is worth (\d+) points/)!;
    const [nbPlayers, lastMarble] = groups.map(x => parseInt(x, 10));

    part1(nbPlayers, lastMarble);
})();

function part1(nbPlayers: number, lastMarble: number) {
    const score = solve(nbPlayers, lastMarble);
    console.log(`Answer to part 1: ${score}`);
}

function solve(nbPlayers: number, lastMarble: number): number {
    const scores = new Array<number>(nbPlayers).fill(0);
    let marbles = [0];
    let currentMarbleIndex = 0;
    let currentPlayer = 0;
    for (let newMarble = 1; newMarble <= lastMarble; newMarble++) {
        if (newMarble % 23 === 0) {
            currentMarbleIndex = modulo(currentMarbleIndex - 7, marbles.length);
            const removedMarble = marbles.splice(currentMarbleIndex, 1)[0]!;
            scores[currentPlayer] += newMarble + removedMarble;
        } else {
            currentMarbleIndex = modulo(currentMarbleIndex + 2, marbles.length);
            marbles.splice(currentMarbleIndex, 0, newMarble);
        }
        currentPlayer = (currentPlayer + 1) % nbPlayers;
    }

    return Math.max(...scores);
}

function modulo(a: number, b: number): number {
    let ret = a % b;
    if (ret < 0) {
        ret += b;
    }
    return ret;
}
