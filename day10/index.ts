import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

interface Light {
    // Position
    px: number;
    py: number;
    // Velocity
    vx: number;
    vy: number;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lights: Light[] = input
        .trim()
        .split('\n')
        .map(line => {
            const [_, px, py, vx, vy] = line.match(/^position=<\s*(-?\d+),\s*(-?\d+)> velocity=<\s*(-?\d+),\s*(-?\d+)>$/)!;
            return {
                px: Number(px),
                py: Number(py),
                vx: Number(vx),
                vy: Number(vy)
            };
        });

    solve(lights);

})();

type Grid = Map<number, Set<number>>;

interface Boundaries {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
}

function solve(lights: Light[]) {
    let prevLights: Light[];
    let bounds = getBounds(lights);
    let prevBounds: Boundaries;

    let time = 0;
    do {
        prevLights = lights;
        prevBounds = bounds;

        // Step
        lights = lights.map(light => ({
            px: light.px + light.vx,
            py: light.py + light.vy,
            vx: light.vx,
            vy: light.vy
        }));
        bounds = getBounds(lights);
        time += 1;

        // Keep iterating while new area is smaller than previous area
    } while ((bounds.width * bounds.height) < (prevBounds.width * prevBounds.height));

    // Print the lights with the smallest area
    console.log(`Answer to part 1:`);
    printGrid(createGrid(prevLights), prevBounds);

    console.log(`Answer to part 2: ${time - 1} seconds`);
}

function getBounds(lights: Light[]): Boundaries {
    const minX = minBy(lights, light => light.px);
    const maxX = maxBy(lights, light => light.px);
    const minY = minBy(lights, light => light.py);
    const maxY = maxBy(lights, light => light.py);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    return {
        minX,
        maxX,
        minY,
        maxY,
        width,
        height
    }
}

function maxBy<T>(array: T[], fn: (element: T) => number): number {
    return array.reduce((max, element) => Math.max(max, fn(element)), -Infinity);
}

function minBy<T>(array: T[], fn: (element: T) => number): number {
    return array.reduce((min, element) => Math.min(min, fn(element)), +Infinity);
}

function createGrid(lights: Light[]): Grid {
    const grid: Grid = new Map();
    for (let light of lights) {
        if (grid.has(light.py)) {
            grid.get(light.py)!.add(light.px);
        } else {
            grid.set(light.py, new Set([light.px]));
        }
    }
    return grid;
}

function printGrid(grid: Grid, bounds: Boundaries): void {
    const width = bounds.maxX - bounds.minX + 1;
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
        if (grid.has(y)) {
            const row = new Array<string>(width);
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                if (grid.get(y)!.has(x)) {
                    row[x - bounds.minX] = '#';
                } else {
                    row[x - bounds.minX] = '.';
                }
            }
            console.log(`${String(y).padStart(6, " ")}:   ${row.join('')}`);
        }
    }
}
