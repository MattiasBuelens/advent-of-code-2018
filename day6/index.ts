import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

interface Point {
    x: number;
    y: number;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const coords: Point[] = input
        .trim()
        .split('\n')
        .map(line => {
            const [x, y] = line.split(', ').map(x => parseInt(x, 10));
            return {x, y};
        });

    part1(coords);
    part2(coords);
})();

function part1(coords: Point[]) {
    // Find the bounding rectangle around all coordinates
    const xs = coords.map(coord => coord.x);
    const ys = coords.map(coord => coord.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const closest: number[][] = Array.from(new Array(width), () => new Array(height).fill(-1));
    const area = new Array(coords.length).fill(0);
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y < maxY; y++) {
            // Find closest coordinate that is NOT tied with any other coordinate
            let closestCoord = 0;
            let closestDistance = Infinity;
            let isTiedWithOtherCoordinate = false;
            for (let coordIndex = 0; coordIndex < coords.length; coordIndex++) {
                const distance = Math.abs(coords[coordIndex].x - x) + Math.abs(coords[coordIndex].y - y);
                if (distance < closestDistance) {
                    closestCoord = coordIndex;
                    closestDistance = distance;
                    isTiedWithOtherCoordinate = false;
                } else if (distance === closestDistance) {
                    isTiedWithOtherCoordinate = true;
                }
            }
            if (isTiedWithOtherCoordinate) {
                closest[x - minX][y - minY] = -1;
            } else {
                closest[x - minX][y - minY] = closestCoord;
                area[closestCoord] += 1;
            }
        }
    }

    // Print map
    // console.log(closest.map(line => line.map(coord => coord.toString(10).padStart(2, ' ')).join(' ')).join('\n'));

    // All coordinates whose area touches the edge have infinite area
    // FIXME closest[x][y] may be -1, which puts area[i] = Infinity
    for (let x = 0; x < width; x++) {
        area[closest[x][0]] = Infinity;
        area[closest[x][height - 1]] = Infinity;
    }
    for (let y = 0; y < height; y++) {
        area[closest[0][y]] = Infinity;
        area[closest[width - 1][y]] = Infinity;
    }

    // Print areas
    // for (let coordIndex = 0; coordIndex < coords.length; coordIndex++) {
    //     const {x, y} = coords[coordIndex];
    //     const coordArea = area[coordIndex];
    //     console.log(`(${x}, ${y}) has area: ${coordArea}`);
    // }

    // Find largest finite area
    let largestArea = 0;
    let largestCoordIndex = 0;
    for (let coordIndex = 0; coordIndex < coords.length; coordIndex++) {
        const coordArea = area[coordIndex];
        if (coordArea !== Infinity && coordArea > largestArea) {
            largestArea = coordArea;
            largestCoordIndex = coordIndex;
        }
    }
    const largestCoord = coords[largestCoordIndex];
    console.log(`Coord #${largestCoordIndex} (${largestCoord.x}, ${largestCoord.y}) has largest finite area: ${largestArea}`);
    console.log(`Answer to part 1: ${largestArea}`);
}

function part2(coords: Point[]) {
    // Find the bounding rectangle around all coordinates
    const xs = coords.map(coord => coord.x);
    const ys = coords.map(coord => coord.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    let safeRegionArea = 0;
    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y < maxY; y++) {
            // Sum distances to all coordinates
            let distance = coords.reduce((distance, coord) => {
                return distance + Math.abs(coord.x - x) + Math.abs(coord.y - y);
            }, 0);
            // If distance if within safe threshold, add it to the region
            if (distance < 10_000) {
                safeRegionArea += 1;
            }
        }
    }

    console.log(`Answer to part 2: ${safeRegionArea}`);
}
