import * as fs from 'fs';
import * as assert from 'assert';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    const veins = parse(lines);

    const answer1 = part1(veins);
    console.log(`Answer to part 1: ${answer1}`);
})();

const enum VeinDirection {
    HORIZONTAL,
    VERTICAL
}

interface HorizontalVein {
    dir: VeinDirection.HORIZONTAL;
    y: number;
    minX: number;
    maxX: number;
}

interface VerticalVein {
    dir: VeinDirection.VERTICAL;
    x: number;
    minY: number;
    maxY: number;
}

type Vein = HorizontalVein | VerticalVein;

function isHorizontalVein(vein: Vein): vein is HorizontalVein {
    return vein.dir === VeinDirection.HORIZONTAL;
}

function isVerticalVein(vein: Vein): vein is VerticalVein {
    return vein.dir === VeinDirection.VERTICAL;
}

function parse(lines: string[]): Vein[] {
    return lines.map((line): Vein => {
        if (line.startsWith('x')) {
            const [, x, minY, maxY] = line.match(/^x=(\d+), y=(\d+)..(\d+)$/)!.map(Number);
            return {dir: VeinDirection.VERTICAL, x, minY, maxY};
        } else {
            const [, y, minX, maxX] = line.match(/^y=(\d+), x=(\d+)..(\d+)$/)!.map(Number);
            return {dir: VeinDirection.HORIZONTAL, y, minX, maxX};
        }
    });
}

const enum Tile {
    SAND = '.',
    CLAY = '#',
    REST = '~',
    PASSED = '|'
}

type Grid = Tile[][];

function createGrid(veins: Vein[]): { grid: Grid, minX: number } {
    const horizontalVeins = veins.filter(isHorizontalVein);
    const verticalVeins = veins.filter(isVerticalVein);
    // Any x coordinate is valid.
    // (In the worst case, we need at most one extra column on both sides.)
    const minX = Math.min(minBy(horizontalVeins, vein => vein.minX), minBy(verticalVeins, vein => vein.x)) - 1;
    const maxX = Math.max(maxBy(horizontalVeins, vein => vein.maxX), maxBy(verticalVeins, vein => vein.x)) + 1;
    // To prevent counting forever, ignore tiles with a y coordinate smaller than the smallest y coordinate
    // in your scan data or larger than the largest one.
    const minY = Math.min(minBy(verticalVeins, vein => vein.minY), minBy(horizontalVeins, vein => vein.y));
    const maxY = Math.max(maxBy(verticalVeins, vein => vein.maxY), maxBy(horizontalVeins, vein => vein.y));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const grid: Tile[][] = Array.from(new Array(height), () => new Array(width).fill(Tile.SAND));
    // Horizontal veins of clay
    for (const vein of horizontalVeins) {
        for (let x = vein.minX; x <= vein.maxX; x++) {
            grid[vein.y - minY][x - minX] = Tile.CLAY;
        }
    }
    // Vertical veins of clay
    for (const vein of verticalVeins) {
        for (let y = vein.minY; y <= vein.maxY; y++) {
            grid[y - minY][vein.x - minX] = Tile.CLAY;
        }
    }
    return {grid, minX};
}

function printGrid(grid: Grid) {
    console.log(grid.map(row => row.join('')).join('\n'));
}

function maxBy<T>(array: T[], fn: (element: T) => number): number {
    return array.reduce((max, element) => Math.max(max, fn(element)), -Infinity);
}

function minBy<T>(array: T[], fn: (element: T) => number): number {
    return array.reduce((min, element) => Math.min(min, fn(element)), +Infinity);
}

function flow(grid: Grid, x: number, y: number) {
    assert.ok(y < grid.length);
    assert.ok(x < grid[0].length);
    let tile = grid[y][x];
    if (tile !== Tile.SAND) {
        // Already computed
        return;
    }
    grid[y][x] = Tile.PASSED;
    if (y === grid.length - 1) {
        // Water continues falling out the bottom
        return;
    }
    flow(grid, x, y + 1);
    const belowTile = grid[y + 1][x];
    if (belowTile === Tile.PASSED) {
        // Water always moves down when possible
        return;
    } else if (belowTile === Tile.CLAY || belowTile === Tile.REST) {
        // Water spreads to the left and right otherwise
        flow(grid, x - 1, y);
        flow(grid, x + 1, y);
        // Water fills space that has clay on both sides and falls out otherwise.
        let leftX = findSide(grid, x, y, -1);
        let rightX = findSide(grid, x, y, +1);
        if (leftX !== -1 && rightX !== -1) {
            // Found both sides, water can rest.
            for (let fillX = leftX + 1; fillX < rightX; fillX++) {
                grid[y][fillX] = Tile.REST;
            }
        }
    } else {
        assert.fail('cannot happen!');
    }
}

function findSide(grid: Grid, x: number, y: number, step: number): number {
    while (grid[y][x] !== Tile.CLAY) {
        const belowTile = grid[y + 1][x];
        if (belowTile !== Tile.CLAY && belowTile !== Tile.REST) {
            // Hole in the bottom, water cannot rest!
            return -1;
        }
        x += step;
    }
    // Found a clay wall
    return x;
}

function isReached(tile: Tile): boolean {
    return tile === Tile.REST || tile === Tile.PASSED;
}

function countReached(grid: Grid): number {
    return grid.reduce((count, row) => {
        return count + row.reduce((count, tile) => {
            return count + (isReached(tile) ? 1 : 0);
        }, 0);
    }, 0);
}

function part1(veins: Vein[]) {
    const {grid, minX} = createGrid(veins);
    // There is also a spring of water near the surface at x=500, y=0.
    const [springX, springY] = [500, 0];
    flow(grid, springX - minX, springY);
    if (DEBUG) {
        printGrid(grid);
    }
    return countReached(grid);
}
