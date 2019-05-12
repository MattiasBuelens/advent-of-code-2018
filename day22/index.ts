import * as fs from 'fs';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

interface Position {
    x: number;
    y: number;
}

const enum RegionType {
    ROCKY = 0,
    WET = 1,
    NARROW = 2
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const {depth, target} = parse(lines);

    const answer1 = part1(depth, target);
    console.log(`Answer to part 1: ${answer1}`);
})();

function parse(lines: string[]): { depth: number, target: Position } {
    const [, depth] = lines[0].match(/^depth: (\d+)$/)!.map(Number);
    const [, x, y] = lines[1].match(/^target: (\d+),(\d+)$/)!.map(Number);
    return {depth, target: {x, y}};
}

function computeErosionLevels(erosionLevels: number[][], depth: number, target: Position, pos: Position) {
    // Compute extra rows
    for (let y = erosionLevels.length; y <= pos.y; y++) {
        erosionLevels[y] = [];
    }
    // Compute extra columns
    for (let y = 0; y <= pos.y; y++) {
        for (let x = erosionLevels[y].length; x <= pos.x; x++) {
            let geologicIndex: number;
            if (y === 0 && x === 0) {
                // The region at 0,0 (the mouth of the cave) has a geologic index of 0.
                geologicIndex = 0;
            } else if (y === target.y && x === target.x) {
                // The region at the coordinates of the target has a geologic index of 0.
                geologicIndex = 0;
            } else if (y === 0) {
                // If the region's Y coordinate is 0, the geologic index is its X coordinate times 16807.
                geologicIndex = x * 16807;
            } else if (x === 0) {
                // If the region's X coordinate is 0, the geologic index is its Y coordinate times 48271.
                geologicIndex = y * 48271;
            } else {
                // Otherwise, the region's geologic index is the result of multiplying the erosion levels
                // of the regions at X-1,Y and X,Y-1.
                geologicIndex = erosionLevels[y][x - 1] * erosionLevels[y - 1][x];
            }
            // A region's erosion level is its geologic index plus the cave system's depth, all modulo 20183.
            const erosionLevel = (geologicIndex + depth) % 20183;
            erosionLevels[y][x] = erosionLevel;
        }
    }
}

function part1(depth: number, target: Position): number {
    const width = target.x + 1;
    const height = target.y + 1;
    const erosionLevels: number[][] = [];
    computeErosionLevels(erosionLevels, depth, target, target);
    let riskLevel: number = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const erosionLevel = erosionLevels[y][x];
            // If the erosion level modulo 3 is 0, the region's type is rocky.
            // If the erosion level modulo 3 is 1, the region's type is wet.
            // If the erosion level modulo 3 is 2, the region's type is narrow.
            const regionType = (erosionLevel % 3) as RegionType;
            // Add up the risk level of each individual region: 0 for rocky regions, 1 for wet regions,
            // and 2 for narrow regions.
            riskLevel += regionType;
        }
    }
    return riskLevel;
}
