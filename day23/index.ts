import * as fs from 'fs';
import * as assert from 'assert';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

interface Position {
    x: number;
    y: number;
    z: number;
}

interface Nanobot {
    pos: Position;
    radius: number;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const nanobots = parse(lines);

    const answer1 = part1(nanobots);
    console.log(`Answer to part 1: ${answer1}`);

    const answer2 = part2(nanobots);
    console.log(`Answer to part 2: ${answer2}`);
})();

function parse(lines: string[]): Nanobot[] {
    return lines.map((line) => {
        const [, x, y, z, r] = line.match(/^pos=<(-?\d+),(-?\d+),(-?\d+)>, r=(\d+)$/)!.map(Number);
        return {
            pos: {x, y, z},
            radius: r
        };
    });
}

function getManhattanDistance(left: Position, right: Position): number {
    return Math.abs(left.x - right.x)
        + Math.abs(left.y - right.y)
        + Math.abs(left.z - right.z);
}

function maxBy<T>(array: T[], fn: (element: T) => number): T {
    assert.ok(array.length > 0);
    let maxElement: T = array[0];
    let maxValue = fn(maxElement);
    for (let i = 1; i < array.length; i++) {
        const element = array[i];
        const value = fn(element);
        if (value > maxValue) {
            maxElement = element;
            maxValue = value;
        }
    }
    return maxElement;
}

function part1(nanobots: Nanobot[]): number {
    const strongestNanobot = maxBy(nanobots, (bot) => bot.radius);
    if (DEBUG) {
        console.log('Strongest nanobot at', strongestNanobot.pos, 'with radius', strongestNanobot.radius);
    }
    const inRange = nanobots.filter((bot) => {
        return getManhattanDistance(strongestNanobot.pos, bot.pos) <= strongestNanobot.radius;
    });
    return inRange.length;
}

interface Boundaries {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
}

function getBoundaries(nanobots: Nanobot[]): Boundaries {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let minZ = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    let maxZ = Number.MIN_SAFE_INTEGER;
    for (let {pos, radius} of nanobots) {
        minX = Math.min(minX, pos.x - radius);
        minY = Math.min(minY, pos.y - radius);
        minZ = Math.min(minZ, pos.z - radius);
        maxX = Math.max(maxX, pos.x + radius);
        maxY = Math.max(maxY, pos.y + radius);
        maxZ = Math.max(maxZ, pos.z + radius);
    }
    return {minX, minY, minZ, maxX, maxY, maxZ};
}

function part2(nanobots: Nanobot[]): number {
    const startPos: Position = {x: 0, y: 0, z: 0};
    const gridBounds = getBoundaries(nanobots);
    const largestDiagonal
        = Math.max(gridBounds.maxX, gridBounds.maxY, gridBounds.maxZ)
        - Math.min(gridBounds.minX, gridBounds.minY, gridBounds.minZ);

    // 1. Sample the grid at points |x,y,z| a distance |radius| apart.
    // 2. Find all bots that are in range of a sphere centered at |x,y,z| with |radius|.
    //    Remember the sphere where the most bots are within range.
    //    The point of most overlap must be within that sphere.
    // 3. Reduce the search grid to the neighbourhood of that sphere,
    //    and divide |radius| by two.
    // 4. Repeat until radius is less than one.
    // 5. We found a sphere with |radius| = 1 that is in range of the most bots,
    //    so this sphere's center is the point of most overlap.
    let bounds = gridBounds;
    let radius = largestDiagonal;
    let bestPos: Position = startPos;
    let bestInRange: number;
    let bestDistance: number;
    do {
        bestInRange = 0;
        bestDistance = Number.MAX_SAFE_INTEGER;
        for (let x = bounds.minX; x <= bounds.maxX; x += radius) {
            for (let y = bounds.minY; y <= bounds.maxY; y += radius) {
                for (let z = bounds.minZ; z <= bounds.maxZ; z += radius) {
                    const pos: Position = {x, y, z};
                    const inRange = nanobots.filter((bot) => {
                        // Two spheres overlap if the distance between their center points
                        // is less than the sum of their radii.
                        return getManhattanDistance(pos, bot.pos) < radius + bot.radius;
                    }).length;
                    if (inRange > bestInRange || (inRange === bestInRange && getManhattanDistance(startPos, pos) < bestDistance)) {
                        bestPos = pos;
                        bestInRange = inRange;
                        bestDistance = getManhattanDistance(startPos, pos);
                    }
                }
            }
        }

        bounds = {
            minX: bestPos.x - radius,
            maxX: bestPos.x + radius,
            minY: bestPos.y - radius,
            maxY: bestPos.y + radius,
            minZ: bestPos.z - radius,
            maxZ: bestPos.z + radius,
        };
        radius = Math.floor(radius / 2);
    } while (radius > 0);

    if (DEBUG) {
        console.log({bestPos, bestInRange, bestDistance});
    }
    return bestDistance;
}
