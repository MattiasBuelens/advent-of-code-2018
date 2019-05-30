import * as fs from 'fs';
import {promisify} from 'util';
import {DEBUG} from '../debug';

const readFile = promisify(fs.readFile);

type Point = [number, number, number, number];
type Constellation = Point[];

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const points = parse(lines);

    const answer1 = part1(points);
    console.log(`Answer to part 1: ${answer1}`);
})();

function parse(lines: string[]): Point[] {
    return lines.map(line => line.split(',').map(Number) as Point);
}

function getManhattanDistance(left: Point, right: Point): number {
    return Math.abs(left[0] - right[0])
        + Math.abs(left[1] - right[1])
        + Math.abs(left[2] - right[2])
        + Math.abs(left[3] - right[3]);
}

function part1(points: Point[]): number {
    const constellations: Constellation[] = [];
    for (let point of points) {
        let constellationWithPoint: Constellation = [point];
        for (let i = constellations.length - 1; i >= 0; i--) {
            // Two points are in the same constellation if their manhattan distance apart is no more than 3
            // or if they can form a chain of points, each a manhattan distance no more than 3 from the last,
            // between the two of them. (That is, if a point is close enough to a constellation,
            // it "joins" that constellation.)
            const constellation = constellations[i];
            for (let pointInConstellation of constellation) {
                if (getManhattanDistance(point, pointInConstellation) <= 3) {
                    // Join constellations
                    constellationWithPoint.push(...constellation);
                    constellations.splice(i, 1);
                    break;
                }
            }
        }
        constellations.push(constellationWithPoint);
    }
    if (DEBUG) {
        console.log(constellations);
    }
    return constellations.length;
}
