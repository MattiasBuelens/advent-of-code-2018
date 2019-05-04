import * as fs from 'fs';
import * as assert from 'assert';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

const enum Direction {
    NORTH = 'N',
    EAST = 'E',
    SOUTH = 'S',
    WEST = 'W'
}

const DIRECTIONS: Direction[] = [
    Direction.NORTH,
    Direction.EAST,
    Direction.SOUTH,
    Direction.WEST
];

interface Position {
    x: number;
    y: number;
}

interface Room {
    pos: Position;
    doors: { [D in Direction]?: Room };
    distance: number;
}

type RoomMap = Map<number, Map<number, Room>>;

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const regex = input.trim();

    const answer1 = part1(regex);
    console.log(`Answer to part 1: ${answer1}`);
})();

function opposite(dir: Direction): Direction {
    switch (dir) {
        case Direction.NORTH:
            return Direction.SOUTH;
        case Direction.EAST:
            return Direction.WEST;
        case Direction.SOUTH:
            return Direction.NORTH;
        case Direction.WEST:
            return Direction.EAST;
    }
}

function step({x, y}: Position, dir: Direction): Position {
    switch (dir) {
        case Direction.NORTH:
            return {x, y: y - 1};
        case Direction.EAST:
            return {x: x + 1, y};
        case Direction.SOUTH:
            return {x, y: y + 1};
        case Direction.WEST:
            return {x: x - 1, y};
    }
}

function getRoomAt(map: RoomMap, {x, y}: Position): Room | undefined {
    return map.has(y) ? map.get(y)!.get(x) : undefined;
}

function createRoom(map: RoomMap, pos: Position): Room {
    const room: Room = {
        pos,
        doors: {
            [Direction.NORTH]: undefined,
            [Direction.EAST]: undefined,
            [Direction.SOUTH]: undefined,
            [Direction.WEST]: undefined
        },
        distance: -1
    };
    if (!map.has(pos.y)) {
        map.set(pos.y, new Map());
    }
    map.get(pos.y)!.set(pos.x, room);
    return room;
}

function addDoor(map: RoomMap, room: Room, dir: Direction): Room {
    // Get or add adjacent room
    const adjacentPos = step(room.pos, dir);
    let adjacentRoom = getRoomAt(map, adjacentPos);
    if (!adjacentRoom) {
        adjacentRoom = createRoom(map, adjacentPos);
    }
    // Add door
    room.doors[dir] = adjacentRoom;
    adjacentRoom.doors[opposite(dir)] = room;
    return adjacentRoom;
}

interface State {
    rooms: Set<Room>;
    index: number;
}

function addAll<T>(set: Set<T>, toAdd: Set<T>): void {
    for (const element of toAdd) {
        set.add(element);
    }
}

function parse(map: RoomMap, regex: string, index: number, rooms: Set<Room>): State {
    loop: while (index < regex.length) {
        switch (regex[index]) {
            case Direction.NORTH:
            case Direction.EAST:
            case Direction.SOUTH:
            case Direction.WEST: {
                // Add door to all current rooms
                const dir = regex[index] as Direction;
                const newRooms = new Set<Room>();
                for (let room of rooms) {
                    newRooms.add(addDoor(map, room, dir));
                }
                rooms = newRooms;
                break;
            }
            case '(': {
                // Start one or more branches
                const newRooms = new Set<Room>();
                do {
                    index++; // consume "(" or "|"
                    const branch = parse(map, regex, index, rooms);
                    addAll(newRooms, branch.rooms);
                    index = branch.index;
                } while (regex[index] === '|');
                assert.ok(regex[index] === ')', `expected token ")" but got "${regex[index]}" at index ${index}`);
                rooms = newRooms;
                break;
            }
            case '|':
            case ')': {
                // Note: do not consume token, so caller can handle it
                break loop;
            }
            case '^': {
                assert.ok(index === 0, `unexpected token "^" at index ${index}`);
                break;
            }
            case '$': {
                assert.ok(index === regex.length - 1, `unexpected token "$" at index ${index}`);
                break;
            }
            default: {
                assert.fail(`unexpected token "${regex[index]}" at index ${index}`);
            }
        }
        index++;
    }
    return {rooms, index};
}

interface Boundaries {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

function getBoundaries(map: RoomMap): Boundaries {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    for (const [y, row] of map) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        for (const [x] of row) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
        }
    }
    return {minX, minY, maxX, maxY};
}

function mapToArray(map: RoomMap): Room[][] {
    const {minX, minY, maxX, maxY} = getBoundaries(map);
    const mapArray: Room[][] = [];
    for (let y = minY; y <= maxY; y++) {
        const row = map.get(y)!;
        const rowArray: Room[] = [];
        for (let x = minX; x <= maxX; x++) {
            rowArray.push(row.get(x)!);
        }
        mapArray.push(rowArray);
    }
    return mapArray;
}

function printMap(map: RoomMap) {
    const mapArray = mapToArray(map);
    console.log('##'.repeat(mapArray[0].length) + '#');
    for (let row of mapArray) {
        let line1: string[] = ['#'];
        let line2: string[] = ['#'];
        for (let room of row) {
            line1.push(
                (room.pos.x === 0 && room.pos.y === 0) ? 'X' : '.',
                room.doors[Direction.EAST] ? '|' : '#'
            );
            line2.push(
                room.doors[Direction.SOUTH] ? '-' : '#',
                '#'
            );
        }
        console.log(line1.join(''));
        console.log(line2.join(''));
    }
}

function isDefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

function getAdjacentRooms(room: Room): Room[] {
    return DIRECTIONS.map(dir => room.doors[dir]).filter(isDefined);
}

function compareByDistance(left: Room, right: Room): number {
    return (left.distance - right.distance);
}

function comparePositions(left: Position, right: Position): number {
    return (left.y - right.y) || (left.x - right.x);
}

function compareRooms(left: Room, right: Room): number {
    return compareByDistance(left, right) || comparePositions(left.pos, right.pos);
}

function binarySearch<T>(array: T[], key: T, compare: (left: T, right: T) => number): number {
    let low = 0;
    let high = array.length - 1;
    while (low <= high) {
        let mid = (low + high) >>> 1;
        let cmp = compare(array[mid], key);
        if (cmp < 0) {
            low = mid + 1;
        } else if (cmp > 0) {
            high = mid - 1;
        } else {
            return mid; // key found
        }
    }
    return -(low + 1);  // key not found
}

function findDistances(map: RoomMap, startRoom: Room) {
    // https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm#Algorithm
    // 1. Mark all nodes unvisited.
    //    Create a set of all the unvisited nodes called the unvisited set.
    // 2. Assign to every node a tentative distance value:
    //    set it to zero for our initial node and to infinity for all other nodes.
    //    Set the initial node as current.
    const unvisited: Room[] = [];
    const visited: Set<Room> = new Set();
    for (let [y, row] of map) {
        for (let [x, room] of row) {
            room.distance = Number.MAX_SAFE_INTEGER;
            unvisited.push(room);
        }
    }
    startRoom.distance = 0;
    unvisited.sort(compareRooms);

    // 5. If [...] the smallest tentative distance among the nodes in the unvisited set is infinity
    //    (when planning a complete traversal; occurs when there is no connection between the initial node
    //    and remaining unvisited nodes), then stop. The algorithm has finished.
    while (unvisited.length > 0 && unvisited[0].distance < Number.MAX_SAFE_INTEGER) {
        // 6. Otherwise, select the unvisited node that is marked with the smallest tentative distance,
        //    set it as the new "current node", and go back to step 3.
        let current = unvisited[0];

        // 3. For the current node, consider all of its unvisited neighbors and calculate their tentative
        //    distances through the current node. Compare the newly calculated tentative distance to the
        //    current assigned value and assign the smaller one.
        for (let neighbour of getAdjacentRooms(current)) {
            if (visited.has(neighbour)) {
                continue;
            }
            let costThroughCurrent = current.distance + 1;
            if (costThroughCurrent < neighbour.distance) {
                // Found better path through current
                let oldIndex = binarySearch(unvisited, neighbour, compareRooms);
                if (DEBUG) {
                    assert.strictEqual(unvisited[oldIndex], neighbour);
                }
                unvisited.splice(oldIndex, 1);

                neighbour.distance = costThroughCurrent;

                let newIndex = -(binarySearch(unvisited, neighbour, compareRooms) + 1);
                unvisited.splice(newIndex, 0, neighbour);
            }
        }

        // 4. When we are done considering all of the unvisited neighbors of the current node,
        //    mark the current node as visited and remove it from the unvisited set.
        //    A visited node will never be checked again.
        visited.add(current);
        unvisited.shift();
    }
}

function getFurthestRoom(map: RoomMap): Room {
    let furthestRoom: Room = map.get(0)!.get(0)!;
    for (let [y, row] of map) {
        for (let [x, room] of row) {
            if (room.distance > furthestRoom.distance) {
                furthestRoom = room;
            }
        }
    }
    return furthestRoom;
}

function part1(regex: string) {
    const map: RoomMap = new Map();
    const startRoom = createRoom(map, {x: 0, y: 0});
    parse(map, regex, 0, new Set<Room>([startRoom]));
    if (DEBUG) {
        printMap(map);
    }

    findDistances(map, startRoom);
    const furthestRoom = getFurthestRoom(map);
    if (DEBUG) {
        console.log(`Furthest room is at (${furthestRoom.pos.x},${furthestRoom.pos.y}) with distance ${furthestRoom.distance}`);
    }
    return furthestRoom.distance;
}
