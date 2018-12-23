import * as fs from 'fs';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

enum Track {
    WE = '-',
    NS = '|',
    NE = '/',
    NW = '\\',
    INTERSECT = '+'
}

enum Direction {
    LEFT = '<',
    RIGHT = '>',
    UP = '^',
    DOWN = 'v'
}

enum Exit {
    LEFT,
    STRAIGHT,
    RIGHT
}

interface Cart {
    /**
     * X position
     */
    x: number;
    /**
     * Y position
     */
    y: number;
    /**
     * Direction
     */
    dir: Direction;
    /**
     * Exit to take at the next intersection
     */
    exit: Exit;
}

type TrackMap = Map<number, Map<number, Track>>;

interface Board {
    carts: Cart[];
    tracks: TrackMap;
}

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.split('\n');
    const board = parseBoard(lines);

    part1(board);
    part2(board);
})();

function part1({carts, tracks}: Board) {
    // Keep going as long as no carts collided
    let collision: [number, number] | undefined;
    for (let t = 1; !collision; t++) {
        if (DEBUG) {
            console.log(`Tick ${t}`);
        }
        carts.sort(compareCartByPosition);
        for (let i = 0; i < carts.length && !collision; i++) {
            carts[i] = tick(tracks, carts, i);
            collision = findCollision(carts);
        }
    }

    const cart = carts[collision[0]];
    console.log(`Answer to part 1: ${cart.x},${cart.y}`);
}

function part2({carts, tracks}: Board) {
    // Keep going as long as more than one cart is left
    for (let t = 1; carts.length > 1; t++) {
        if (DEBUG) {
            console.log(`Tick ${t}`);
        }
        carts.sort(compareCartByPosition);
        for (let i = 0; i < carts.length; i++) {
            carts[i] = tick(tracks, carts, i);

            // Find and remove colliding carts
            let collision = findCollision(carts);
            if (collision) {
                // Adjust cart index for next tick
                if (i >= collision[1]) {
                    i--;
                }
                if (i >= collision[0]) {
                    i--;
                }
                // Need to remove these in the right order!
                carts.splice(collision[1], 1);
                carts.splice(collision[0], 1);
            }
        }
    }

    const lastCart = carts[0];
    console.log(`Answer to part 2: ${lastCart.x},${lastCart.y}`);
}

function parseBoard(lines: string[]): Board {
    const carts: Cart[] = [];
    const tracks: TrackMap = new Map<number, Map<number, Track>>();

    function addTrack(x: number, y: number, track: Track) {
        let row: Map<number, Track>;
        if (tracks.has(y)) {
            row = tracks.get(y)!;
        } else {
            row = new Map<number, Track>();
            tracks.set(y, row);
        }
        row.set(x, track);
    }

    function addCart(x: number, y: number, dir: Direction) {
        carts.push({x, y, dir, exit: Exit.LEFT});
    }

    for (let y = 0; y < lines.length; y++) {
        const line = lines[y];
        for (let x = 0; x < line.length; x++) {
            const char = line[x];
            switch (char) {
                case '-':
                case '|':
                case '/':
                case '\\':
                case '+': {
                    addTrack(x, y, parseTrack(char));
                    break;
                }
                case '>':
                case '<': {
                    addCart(x, y, parseDirection(char));
                    addTrack(x, y, Track.WE);
                    break;
                }
                case '^':
                case 'v': {
                    addCart(x, y, parseDirection(char));
                    addTrack(x, y, Track.NS);
                    break;
                }
            }
        }
    }

    // Carts are already sorted by construction
    // carts.sort(compareCartByPosition);

    return {carts, tracks};
}

function parseTrack(char: '-' | '|' | '/' | '\\' | '+'): Track {
    switch (char) {
        case '-':
            return Track.WE;
        case '|':
            return Track.NS;
        case '/':
            return Track.NE;
        case '\\':
            return Track.NW;
        case '+':
            return Track.INTERSECT;
    }
}

function parseDirection(char: '<' | '>' | '^' | 'v'): Direction {
    switch (char) {
        case '<':
            return Direction.LEFT;
        case '>':
            return Direction.RIGHT;
        case '^':
            return Direction.UP;
        case 'v':
            return Direction.DOWN;
    }
}

function tick(tracks: TrackMap, carts: Cart[], cartIndex: number): Cart {
    const cart = carts[cartIndex];
    let {x, y, dir, exit} = cart;
    let track = tracks.get(y)!.get(x);
    let newDir: Direction = dir;
    let newExit: Exit = exit;
    switch (track) {
        case Track.WE:
        case Track.NS:
            // do nothing
            break;
        case Track.NE:
            newDir = curveNE(dir);
            break;
        case Track.NW:
            newDir = curveNW(dir);
            break;
        case Track.INTERSECT:
            newDir = takeExit(dir, exit);
            newExit = nextExit(exit);
            break;
    }
    let {x: newX, y: newY} = stepPosition(x, y, newDir);
    const newCart = {x: newX, y: newY, dir: newDir, exit: newExit};
    if (DEBUG) {
        console.log(`Cart #${cartIndex} on ${track} from ${JSON.stringify(cart)} to ${JSON.stringify(newCart)}`);
    }
    return newCart;
}

function stepPosition(x: number, y: number, dir: Direction): { x: number, y: number } {
    switch (dir) {
        case Direction.LEFT:
            return {x: x - 1, y};
        case Direction.RIGHT:
            return {x: x + 1, y};
        case Direction.UP:
            return {x, y: y - 1};
        case Direction.DOWN:
            return {x, y: y + 1};
    }
}

function curveNE(dir: Direction): Direction {
    switch (dir) {
        case Direction.UP:
            return Direction.RIGHT;
        case Direction.DOWN:
            return Direction.LEFT;
        case Direction.LEFT:
            return Direction.DOWN;
        case Direction.RIGHT:
            return Direction.UP;
    }
}

function curveNW(dir: Direction): Direction {
    switch (dir) {
        case Direction.UP:
            return Direction.LEFT;
        case Direction.DOWN:
            return Direction.RIGHT;
        case Direction.LEFT:
            return Direction.UP;
        case Direction.RIGHT:
            return Direction.DOWN;
    }
}

function rotateCCW(dir: Direction): Direction {
    switch (dir) {
        case Direction.UP:
            return Direction.LEFT;
        case Direction.LEFT:
            return Direction.DOWN;
        case Direction.DOWN:
            return Direction.RIGHT;
        case Direction.RIGHT:
            return Direction.UP;
    }
}

function rotateCW(dir: Direction): Direction {
    switch (dir) {
        case Direction.UP:
            return Direction.RIGHT;
        case Direction.RIGHT:
            return Direction.DOWN;
        case Direction.DOWN:
            return Direction.LEFT;
        case Direction.LEFT:
            return Direction.UP;
    }
}

function takeExit(dir: Direction, exit: Exit): Direction {
    switch (exit) {
        case Exit.STRAIGHT:
            return dir;
        case Exit.LEFT:
            return rotateCCW(dir);
        case Exit.RIGHT:
            return rotateCW(dir);
    }
}

function nextExit(exit: Exit): Exit {
    switch (exit) {
        case Exit.LEFT:
            return Exit.STRAIGHT;
        case Exit.STRAIGHT:
            return Exit.RIGHT;
        case Exit.RIGHT:
            return Exit.LEFT;
    }
}

function compareCartByPosition(left: Cart, right: Cart): number {
    return (left.y - right.y) || (left.x - right.x);
}

function findCollision(carts: Cart[]): [number, number] | undefined {
    for (let i = 0; i < carts.length; i++) {
        for (let j = i + 1; j < carts.length; j++) {
            const left = carts[i];
            const right = carts[j];
            if (left.x === right.x && left.y === right.y) {
                if (DEBUG) {
                    console.log(
                        `Collision at (${left.x}, ${left.y}) ` +
                        `between ${JSON.stringify(left)} (#${i}) ` +
                        `and ${JSON.stringify(right)} (#${j})`
                    );
                }
                return [i, j];
            }
        }
    }
    return undefined;
}
