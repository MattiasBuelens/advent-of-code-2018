import * as fs from 'fs';
import {promisify} from 'util';
import {DEBUG} from '../debug';

const readFile = promisify(fs.readFile);

const enum Acre {
    OPEN_GROUND = '.',
    TREES = '|',
    LUMBERYARD = '#'
}

type Area = Acre[][];

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const area = parse(lines);

    const answer1 = part1(area);
    console.log(`Answer to part 1: ${answer1}`);

    const answer2 = part2(area);
    console.log(`Answer to part 2: ${answer2}`);
})();

function parse(lines: string[]): Area {
    return lines.map(line => line.split('').map(parseAcre));
}

function isAcre(x: string): x is Acre {
    switch (x) {
        case Acre.OPEN_GROUND:
        case Acre.TREES:
        case Acre.LUMBERYARD:
            return true;
    }
    return false;
}

function parseAcre(x: string): Acre {
    if (!isAcre(x)) {
        throw new TypeError(`Invalid input: ${x}`);
    }
    return x;
}

function getAdjacentAcres(area: Readonly<Area>, y: number, x: number): Acre[] {
    const adjacents: Acre[] = [];
    if (y > 0) {
        if (x > 0) {
            adjacents.push(area[y - 1][x - 1]);
        }
        adjacents.push(area[y - 1][x]);
        if (x < area[y].length - 1) {
            adjacents.push(area[y - 1][x + 1]);
        }
    }
    if (x > 0) {
        adjacents.push(area[y][x - 1]);
    }
    if (x < area[y].length - 1) {
        adjacents.push(area[y][x + 1]);
    }
    if (y < area.length - 1) {
        if (x > 0) {
            adjacents.push(area[y + 1][x - 1]);
        }
        adjacents.push(area[y + 1][x]);
        if (x < area[y].length - 1) {
            adjacents.push(area[y + 1][x + 1]);
        }
    }
    return adjacents;
}

function step(area: Readonly<Area>): Area {
    const newArea: Acre[][] = [];
    for (let y = 0; y < area.length; y++) {
        newArea[y] = [];
        for (let x = 0; x < area[y].length; x++) {
            const acre = area[y][x];
            const adjacents = getAdjacentAcres(area, y, x);
            let newAcre: Acre;
            if (acre === Acre.OPEN_GROUND) {
                // An open acre will become filled with trees if three or more adjacent acres contained trees.
                // Otherwise, nothing happens.
                newAcre = (
                    adjacents.filter(x => x === Acre.TREES).length >= 3
                ) ? Acre.TREES : acre;
            } else if (acre === Acre.TREES) {
                // An acre filled with trees will become a lumberyard if three or more adjacent acres were lumberyards.
                // Otherwise, nothing happens.
                newAcre = (
                    adjacents.filter(x => x === Acre.LUMBERYARD).length >= 3
                ) ? Acre.LUMBERYARD : acre;
            } else {
                // An acre containing a lumberyard will remain a lumberyard if it was adjacent to at least one other
                // lumberyard and at least one acre containing trees. Otherwise, it becomes open.
                newAcre = (
                    adjacents.filter(x => x === Acre.LUMBERYARD).length >= 1
                    && adjacents.filter(x => x === Acre.TREES).length >= 1
                ) ? Acre.LUMBERYARD : Acre.OPEN_GROUND;
            }
            newArea[y][x] = newAcre;
        }
    }
    return newArea;
}

function getResourceValue(area: Area): number {
    let trees = 0;
    let lumberyards = 0;
    for (let y = 0; y < area.length; y++) {
        for (let x = 0; x < area[y].length; x++) {
            const acre = area[y][x];
            if (acre === Acre.TREES) {
                trees++;
            } else if (acre === Acre.LUMBERYARD) {
                lumberyards++;
            }
        }
    }
    // Multiplying the number of wooded acres by the number of lumberyards gives the total resource value.
    return trees * lumberyards;
}

function part1(area: Area): number {
    for (let t = 0; t < 10; t++) {
        area = step(area);
    }
    return getResourceValue(area);
}

function areaToString(area: Area): string {
    return area.map(line => line.join('')).join('\n');
}

function part2(initialArea: Area): number {
    // Map of area to timestamp of first occurrence
    const areaToTime = new Map<string, number>();
    // Iterate until we enter the loop
    let t = 0;
    let area = initialArea;
    while (!areaToTime.has(areaToString(area))) {
        areaToTime.set(areaToString(area), t);
        area = step(area);
        t++;
    }
    // Found the loop!
    const loopEnd = t;
    const loopStart = areaToTime.get(areaToString(area))!;
    const loopLength = loopEnd - loopStart;
    if (DEBUG) {
        console.log(`Area after ${loopEnd} minutes is same as after ${loopStart} minutes`);
    }
    // Reduce target timestamp to equivalent timestamp in first loop
    const target = 1_000_000_000;
    const reducedTarget = ((target - loopStart) % loopLength) + loopStart;
    // Iterate until reduced target timestamp
    area = initialArea;
    for (let t = 0; t < reducedTarget; t++) {
        area = step(area);
    }
    if (DEBUG) {
        console.log(`After ${reducedTarget} minutes (same as after ${target} minutes): ${getResourceValue(area)}`);
    }
    return getResourceValue(area);
}
