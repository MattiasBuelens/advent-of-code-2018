import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const claims = input.trim().split('\n');

    const size = 1000;
    const fabric: number[][] = Array.from(new Array(size), () => new Array(size).fill(0));
    const overlaps: boolean[][] = Array.from(new Array(size), () => new Array(size).fill(false));
    const nonOverlappingIds = new Set<number>();

    let totalOverlaps = 0;
    for (let claim of claims) {
        const [, ...groups] = claim.match(/^#(\d+) @ (\d+),(\d+): (\d+)x(\d+)$/)!;
        const [id, x, y, w, h] = groups.map(x => parseInt(x, 10));
        nonOverlappingIds.add(id);
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                if (fabric[i][j] === 0) {
                    fabric[i][j] = id;
                } else {
                    nonOverlappingIds.delete(id);
                    nonOverlappingIds.delete(fabric[i][j]);
                    if (!overlaps[i][j]) {
                        overlaps[i][j] = true;
                        totalOverlaps++;
                    }
                }
            }
        }
    }

    console.log(`part1: ${totalOverlaps}`);
    console.log(`part2: ${Array.from(nonOverlappingIds).join(',')}`);
})();
