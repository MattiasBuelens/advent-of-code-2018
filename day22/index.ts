import * as fs from 'fs';
import * as assert from 'assert';
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
    const answer2 = part2(depth, target);
    console.log(`Answer to part 2: ${answer2}`);
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

function getRegionType(erosionLevel: number): RegionType {
    // If the erosion level modulo 3 is 0, the region's type is rocky.
    // If the erosion level modulo 3 is 1, the region's type is wet.
    // If the erosion level modulo 3 is 2, the region's type is narrow.
    assert.ok(erosionLevel !== undefined);
    return (erosionLevel % 3) as RegionType;
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
            // Add up the risk level of each individual region: 0 for rocky regions, 1 for wet regions,
            // and 2 for narrow regions.
            riskLevel += getRegionType(erosionLevel);
        }
    }
    return riskLevel;
}

const enum Tool {
    NEITHER,
    TORCH,
    GEAR
}

interface Node {
    pos: Position;
    tool: Tool;
    prev: Node | undefined;
    g: number;
    f: number;
}

function getManhattanDistance(left: Position, right: Position): number {
    return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function getHScore(left: Position, right: Position): number {
    // Heuristic: Manhattan distance
    return getManhattanDistance(left, right);
}

function comparePositions(left: Position, right: Position): number {
    return (left.y - right.y) || (left.x - right.x);
}

function positionEquals(left: Position, right: Position): boolean {
    return (left.y === right.y) && (left.x === right.x);
}

function compareFScore(left: Node, right: Node): number {
    return left.f - right.f;
}

function compareTools(left: Tool, right: Tool): number {
    return left - right;
}

function compareNodes(left: Node, right: Node): number {
    return compareFScore(left, right)
        || comparePositions(left.pos, right.pos)
        || compareTools(left.tool, right.tool);
}

function getAdjacentPositions({x, y}: Position): Position[] {
    let result: Position[] = [];
    result.push({x: x + 1, y});
    result.push({x, y: y + 1});
    // The regions with negative X or Y are solid rock and cannot be traversed.
    if (x > 0) {
        result.push({x: x - 1, y});
    }
    if (y > 0) {
        result.push({x, y: y - 1});
    }
    return result;
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

function getNextTool(currentTool: Tool, currentRegion: RegionType, nextRegion: RegionType): Tool {
    if (nextRegion === RegionType.ROCKY) {
        if (currentTool === Tool.NEITHER) {
            // You cannot use neither (you'll likely slip and fall).
            return currentRegion === RegionType.WET ? Tool.GEAR : Tool.TORCH;
        } else {
            // In rocky regions, you can use the climbing gear or the torch.
            return currentTool;
        }
    } else if (nextRegion === RegionType.WET) {
        if (currentTool === Tool.TORCH) {
            // You cannot use the torch (if it gets wet, you won't have a light source).
            return currentRegion === RegionType.NARROW ? Tool.NEITHER : Tool.GEAR;
        } else {
            // In wet regions, you can use the climbing gear or neither tool.
            return currentTool;
        }
    } else {
        if (currentTool === Tool.GEAR) {
            // You cannot use the climbing gear (it's too bulky to fit).
            return currentRegion === RegionType.ROCKY ? Tool.TORCH : Tool.NEITHER;
        } else {
            // In narrow regions, you can use the torch or neither tool.
            return currentTool;
        }
    }
}

function findBestPath(erosionLevels: number[][], depth: number, target: Position): Node {
    // You start at 0,0 (the mouth of the cave) with the torch equipped.
    const startPos: Position = {x: 0, y: 0};
    const startNode: Node = {
        pos: startPos,
        tool: Tool.TORCH,
        // For each node, which node it can most efficiently be reached from.
        prev: undefined,
        // For each node, the cost of getting from the start node to that node.
        // The cost of going from start to start is zero.
        g: 0,
        // For each node, the total cost of getting from the start node to the goal
        // by passing by that node. That value is partly known, partly heuristic.
        // For the first node, that value is completely heuristic.
        f: getHScore(startPos, target)
    };

    // https://en.wikipedia.org/wiki/A*_search_algorithm
    // The set of nodes already evaluated.
    const closedSet = new Set<Node>();
    // The set of currently discovered nodes that are not evaluated yet.
    // Note: sorted by F score.
    const openSet = new Array<Node>();
    // Map of [position, tool] to node.
    const nodeMap = new Map<number, Map<number, Map<Tool, Node>>>();

    // Initially, only the start node is known.
    computeErosionLevels(erosionLevels, depth, target, startPos);
    addNode(startNode);

    while (openSet.length > 0) {
        // Let current be the node in openSet having the lowest F score value
        let current = openSet[0];
        // Finally, once you reach the target, you need the torch equipped before you can find him in the dark.
        if (positionEquals(current.pos, target) && current.tool === Tool.TORCH) {
            return current;
        }

        openSet.shift();
        closedSet.add(current);

        if (positionEquals(current.pos, target)) {
            // We're at the target, but we haven't equipped our torch yet.
            // Add a node to switch to using the torch.
            if (DEBUG) {
                assert.ok(current.tool !== Tool.TORCH);
                assert.ok(getRegionTypeAtPosition(current.pos) === RegionType.ROCKY);
                assert.ok(getNode(current.pos, Tool.TORCH) === undefined);
            }
            addOrUpdateNeighbour(current, current.pos, Tool.TORCH);
            continue;
        }

        const currentRegion = getRegionTypeAtPosition(current.pos);
        for (let neighbourPos of getAdjacentPositions(current.pos)) {
            // Expand up to neighbour position
            computeErosionLevels(erosionLevels, depth, target, neighbourPos);
            const neighbourRegion = getRegionTypeAtPosition(neighbourPos);
            const newTool = getNextTool(current.tool, currentRegion, neighbourRegion);
            addOrUpdateNeighbour(current, neighbourPos, newTool);
        }
    }

    throw new Error('Target not found');

    function getRegionTypeAtPosition({x, y}: Position): RegionType {
        return getRegionType(erosionLevels[y][x]);
    }

    function addOrUpdateNeighbour(current: Node, neighbourPos: Position, newTool: Tool) {
        let neighbour = getNode(neighbourPos, newTool);
        if (neighbour && closedSet.has(neighbour)) {
            // Ignore the neighbor which is already evaluated.
            return;
        }
        const newG = current.g
            // Moving to an adjacent region takes one minute.
            + getManhattanDistance(current.pos, neighbourPos)
            // Switching to using the climbing gear, torch, or neither always takes seven minutes.
            + (newTool !== current.tool ? 7 : 0);
        const newF = newG + getHScore(neighbourPos, target);
        if (!neighbour) {
            // Discover a new node
            neighbour = {
                pos: neighbourPos,
                tool: newTool,
                prev: current,
                g: newG,
                f: newF
            };
            addNode(neighbour);
        } else if (newG < neighbour.g) {
            // Found better path through current
            updateNode(neighbour, current, newTool, newG, newF);
        }
    }

    function getNode(pos: Position, tool: Tool): Node | undefined {
        if (!nodeMap.has(pos.y)) {
            return undefined;
        }
        const row = nodeMap.get(pos.y)!;
        if (!row.has(pos.x)) {
            return undefined;
        }
        return row.get(pos.x)!.get(tool);
    }

    function addNode(node: Node) {
        if (!nodeMap.has(node.pos.y)) {
            nodeMap.set(node.pos.y, new Map<number, Map<Tool, Node>>());
        }
        const row = nodeMap.get(node.pos.y)!;
        if (!row.has(node.pos.x)) {
            row.set(node.pos.x, new Map<Tool, Node>());
        }
        row.get(node.pos.x)!.set(node.tool, node);

        const index = binarySearch(openSet, node, compareNodes);
        if (DEBUG) {
            assert.ok(index < 0);
        }
        const insertIndex = -(index + 1);
        openSet.splice(insertIndex, 0, node);
    }

    function updateNode(node: Node, newPrev: Node, newTool: Tool, newG: number, newF: number) {
        const oldIndex = binarySearch(openSet, node, compareNodes);
        if (DEBUG) {
            console.assert(oldIndex >= 0);
            console.assert(openSet[oldIndex] === node);
        }
        openSet.splice(oldIndex, 1);

        node.tool = newTool;
        node.prev = newPrev;
        node.g = newG;
        node.f = newF;

        let newIndex = -(binarySearch(openSet, node, compareNodes) + 1);
        if (DEBUG) {
            console.assert(newIndex >= 0);
        }
        openSet.splice(newIndex, 0, node);
    }
}

function part2(depth: number, target: Position): number {
    const erosionLevels: number[][] = [];
    let node = findBestPath(erosionLevels, depth, target);
    return node.g;
}
