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
