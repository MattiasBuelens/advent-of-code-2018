import * as fs from 'fs';
import {promisify} from 'util';

const DEBUG = true;

const readFile = promisify(fs.readFile);

interface Dungeon {
    units: Map<number, Map<number, Unit>>;
    walls: Map<number, Set<number>>;
    width: number;
    height: number;
}

const enum UnitType {
    GOBLIN,
    ELF
}

interface Position {
    x: number;
    y: number;
}

interface Unit extends Position {
    type: UnitType;
    hp: number;
    power: number;
}

const DEFAULT_HP = 200;
const DEFAULT_POWER = 3;

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');

    const dungeon = parseDungeon(lines);
    if (DEBUG) {
        console.log('Initial state:');
        printDungeon(dungeon);
    }
    part1(cloneDungeon(dungeon));
    part2(cloneDungeon(dungeon));
})();

function parseDungeon(lines: string[]): Dungeon {
    const units = new Map<number, Map<number, Unit>>();
    const walls = new Map<number, Set<number>>();
    const height = lines.length;
    const width = lines[0].length;

    for (let y = 0; y < lines.length; y++) {
        const line = lines[y];
        const unitRow = new Map<number, Unit>();
        const wallRow = new Set<number>();
        units.set(y, unitRow);
        walls.set(y, wallRow);
        for (let x = 0; x < line.length; x++) {
            switch (line[x]) {
                case '#': {
                    wallRow.add(x);
                    break;
                }
                case '.': {
                    // do nothing
                    break;
                }
                case 'G': {
                    const goblin = {x, y, type: UnitType.GOBLIN, hp: DEFAULT_HP, power: DEFAULT_POWER};
                    units.get(y)!.set(x, goblin);
                    break;
                }
                case 'E': {
                    const elf = {x, y, type: UnitType.ELF, hp: DEFAULT_HP, power: DEFAULT_POWER};
                    units.get(y)!.set(x, elf);
                    break;
                }
            }
        }
    }
    return {units, walls, width, height};
}

function printDungeon(dungeon: Dungeon) {
    const {units, walls, width, height} = dungeon;

    let firstLine: string[] = [];
    firstLine.push(' '.repeat('99: '.length));
    for (let x = 0; x < width; x++) {
        firstLine.push((x % 10).toString(10));
    }
    console.log(firstLine.join(''));

    for (let y = 0; y < height; y++) {
        let line: string[] = [];
        line.push(y.toString(10).padStart(2, ' ') + ': ');
        for (let x = 0; x < width; x++) {
            if (walls.get(y)!.has(x)) {
                line.push('#');
            } else if (units.get(y)!.has(x)) {
                const unit = units.get(y)!.get(x)!;
                line.push(unit.type === UnitType.GOBLIN ? 'G' : 'E');
            } else {
                line.push('.');
            }
        }
        console.log(line.join(''));
    }
}

function cloneDungeon(dungeon: Dungeon): Dungeon {
    const {width, height} = dungeon;
    const units = new Map<number, Map<number, Unit>>();
    const walls = new Map<number, Set<number>>();
    for (let y = 0; y < height; y++) {
        const unitRow = new Map<number, Unit>();
        units.set(y, unitRow);
        for (let [x, unit] of dungeon.units.get(y)!.entries()) {
            unitRow.set(x, {
                x: unit.x,
                y: unit.y,
                type: unit.type,
                hp: unit.hp,
                power: unit.power
            });
        }
        walls.set(y, new Set<number>([...dungeon.walls.get(y)!]));
    }
    return {units, walls, width, height};
}

function part1(dungeon: Dungeon) {
    let rounds = 0;
    while (true) {
        // Start new round
        const result = doRound(dungeon);
        if (result === RoundResult.END_OF_COMBAT) {
            break;
        }
        // If all units have taken turns in this round, the round ends, and a new round begins.
        rounds++;
        if (DEBUG) {
            console.log(`After round #${rounds}:`);
            printDungeon(dungeon);
        }
    }

    console.log(`After ${rounds} complete rounds:`);
    printDungeon(dungeon);

    // You need to determine the outcome of the battle: the number of full rounds that were completed
    // (not counting the round in which combat ends) multiplied by the sum of the hit points of
    // all remaining units at the moment combat ends.
    // (Combat only ends when a unit finds no targets during its turn.)
    const outcome = rounds * getUnits(dungeon).reduce((sum, unit) => sum + unit.hp, 0);
    console.log(`Answer to part 1: ${outcome}`);
}

function part2(originalDungeon: Dungeon) {
    const nbElves = getUnits(originalDungeon).filter(isElf).length;

    let power = DEFAULT_POWER;
    let rounds = 0;
    let dungeon = cloneDungeon(originalDungeon);
    while (true) {
        // Create dungeon with stronger elves
        if (DEBUG) {
            console.log(`Power: ${power}`);
        }
        for (const unit of getUnits(dungeon).filter(isElf)) {
            unit.power = power;
        }

        // Keep going as long as all elves are alive
        rounds = 0;
        while (getUnits(dungeon).filter(isElf).length === nbElves) {
            // Start new round
            const result = doRound(dungeon);
            if (result === RoundResult.END_OF_COMBAT) {
                break;
            }
            // If all units have taken turns in this round, the round ends, and a new round begins.
            rounds++;
        }

        if (DEBUG) {
            console.log(`After ${rounds} complete rounds:`);
            printDungeon(dungeon);
            console.log();
        }

        const aliveUnits = getUnits(dungeon);
        if (aliveUnits.every(isElf) && aliveUnits.length === nbElves) {
            // Elves win!
            break;
        }

        // Increase power and reset dungeon for next iteration
        power++;
        dungeon = cloneDungeon(originalDungeon);
    }

    if (DEBUG) {
        console.log(`After ${rounds} complete rounds with power ${power}:`);
        printDungeon(dungeon);
        console.log();
    }

    // You need to determine the outcome of the battle: the number of full rounds that were completed
    // (not counting the round in which combat ends) multiplied by the sum of the hit points of
    // all remaining units at the moment combat ends.
    // (Combat only ends when a unit finds no targets during its turn.)
    const outcome = rounds * getUnits(dungeon).reduce((sum, unit) => sum + unit.hp, 0);
    console.log(`Answer to part 2: ${outcome}`);
}

const enum RoundResult {
    CONTINUE,
    END_OF_COMBAT
}

function doRound(dungeon: Dungeon) {
    const turnOrder = getUnits(dungeon).sort(compareByPosition);
    for (let u = 0; u < turnOrder.length; u++) {
        const attacker = turnOrder[u];

        // Each unit begins its turn by identifying all possible targets (enemy units).
        const targets = turnOrder.filter(unit => isTarget(attacker, unit));
        // If no targets remain, combat ends.
        if (targets.length === 0) {
            return RoundResult.END_OF_COMBAT;
        }

        // Then, the unit identifies all of the open squares (.) that are in range of each target;
        // these are the squares which are adjacent (immediately up, down, left, or right)
        // to any target and which aren't already occupied by a wall or another unit.
        let openSquaresInRange = flatMap(targets, getAdjacentPositions)
            .filter(pos => !isOccupied(dungeon, pos))
            .sort(compareByPosition).filter(dedupeByPosition);
        // Alternatively, the unit might already be in range of a target.
        let targetsInRange = targets.filter(target => isAdjacent(attacker, target));
        // If the unit is not already in range of a target,
        // and there are no open squares which are in range of a target,
        // the unit ends its turn.
        if (targetsInRange.length === 0 && openSquaresInRange.length === 0) {
            continue;
        }
        // If the unit is already in range of a target, it does not move, but continues its turn with an attack.
        // Otherwise, since it is not in range of a target, it moves.
        if (targetsInRange.length === 0) {
            // To move, the unit first considers the squares that are in range
            // and determines which of those squares it could reach in the fewest steps.
            // If multiple squares are in range and tied for being reachable in the fewest steps,
            // the square which is first in reading order is chosen.
            let pathsFromAttacker = findPaths(dungeon, attacker);
            let closestOpenSquares = openSquaresInRange
                .map(square => pathsFromAttacker.get(square.y)!.get(square.x)!)
                .filter(path => path.cost < Infinity);
            // If the unit cannot reach (find an open path to) any of the squares that are in range,
            // it ends its turn.
            if (!closestOpenSquares.length) {
                continue;
            }
            // The unit then takes a single step toward the chosen square along the shortest path to that square.
            // If multiple steps would put the unit equally closer to its destination,
            // the unit chooses the step which is first in reading order.
            let closestOpenSquare = minBy(closestOpenSquares, compareByCost);
            let pathsToOpenSquare = findPaths(dungeon, closestOpenSquare);
            let neighbours = getAdjacentPositions(attacker);
            let neighbourPaths = neighbours
                .map(neighbour => pathsToOpenSquare.get(neighbour.y)!.get(neighbour.x)!)
                .filter(path => path.cost < Infinity);
            let nextPosition = minBy(neighbourPaths, compareByCost);
            // Move attacker to next position
            if (DEBUG) {
                console.assert(isAdjacent(attacker, nextPosition));
            }
            dungeon.units.get(attacker.y)!.delete(attacker.x);
            attacker.x = nextPosition.x;
            attacker.y = nextPosition.y;
            dungeon.units.get(attacker.y)!.set(attacker.x, attacker);
        }

        // After moving (or if the unit began its turn in range of a target), the unit attacks.
        // To attack, the unit first determines all of the targets that are in range of it
        // by being immediately adjacent to it.
        targetsInRange = targets.filter(target => isAdjacent(attacker, target));
        // If there are no such targets, the unit ends its turn.
        if (targetsInRange.length === 0) {
            continue;
        }
        // Otherwise, the adjacent target with the fewest hit points is selected;
        // in a tie, the adjacent target with the fewest hit points which is first in reading order is selected.
        const weakestTarget = minBy(targetsInRange, compareByHP);
        // The unit deals damage equal to its attack power to the selected target,
        // reducing its hit points by that amount.
        weakestTarget.hp -= attacker.power;
        // If this reduces its hit points to 0 or fewer, the selected target dies:
        // its square becomes `.` and it takes no further turns.
        if (weakestTarget.hp <= 0) {
            // Remove from dungeon
            dungeon.units.get(weakestTarget.y)!.delete(weakestTarget.x);
            // Remove from turn order
            let weakestTargetOrder = turnOrder.indexOf(weakestTarget);
            turnOrder.splice(weakestTargetOrder, 1);
            if (u >= weakestTargetOrder) {
                u--;
            }
        }
        // After attacking, the unit's turn ends.
    }
    // If all units have taken turns in this round, the round ends, and a new round begins.
    return RoundResult.CONTINUE;
}

function compareByPosition(left: Position, right: Position): number {
    return (left.y - right.y) || (left.x - right.x);
}

function dedupeByPosition(position: Position, index: number, array: Position[]): boolean {
    // Assumes that array is sorted by position
    return (index === 0)
        || (position.x !== array[index - 1].x)
        || (position.y !== array[index - 1].y);
}

function compareByHP(left: Unit, right: Unit): number {
    return (left.hp - right.hp) || compareByPosition(left, right);
}

function isTarget(attacker: Unit, unit: Unit): boolean {
    return unit.type !== attacker.type;
}

function isElf(unit: Unit): boolean {
    return unit.type === UnitType.ELF;
}

function isAdjacent(left: Position, right: Position): boolean {
    return (left.x === right.x && Math.abs(left.y - right.y) === 1)
        || (left.y === right.y && Math.abs(left.x - right.x) === 1);
}

function getUnits(dungeon: Dungeon): Unit[] {
    return flatMap([...dungeon.units.values()], (row) => [...row.values()]);
}

function getAdjacentPositions({x, y}: Position): Position[] {
    return [
        {x, y: y - 1},
        {x, y: y + 1},
        {x: x - 1, y},
        {x: x + 1, y}
    ]
}

function isOccupied(dungeon: Dungeon, {x, y}: Position): boolean {
    return dungeon.units.get(y)!.has(x)
        || dungeon.walls.get(y)!.has(x);
}

function minBy<T>(array: T[], compare: (left: T, right: T) => number): T {
    return array.reduce((min, element) => {
        return compare(min, element) <= 0 ? min : element;
    })
}

function flatMap<T, U>(array: T[], fn: (element: T) => U[]): U[] {
    let result: U[] = [];
    for (let element of array) {
        result.push(...fn(element));
    }
    return result;
}

interface Node extends Position {
    cost: number;
    prev: Node | undefined;
    visited: boolean;
}

type NodeMap = Map<number, Map<number, Node>>;

function findPaths(dungeon: Dungeon, start: Position): NodeMap {
    // https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm#Algorithm
    // 1. Mark all nodes unvisited.
    //    Create a set of all the unvisited nodes called the unvisited set.
    // 2. Assign to every node a tentative distance value:
    //    set it to zero for our initial node and to infinity for all other nodes.
    //    Set the initial node as current.
    const nodes: NodeMap = new Map<number, Map<number, Node>>();
    const unvisited: Node[] = [];
    for (let y = 0; y < dungeon.height; y++) {
        const row = new Map<number, Node>();
        nodes.set(y, row);
        for (let x = 0; x < dungeon.width; x++) {
            const node = {x, y, cost: Infinity, prev: undefined, visited: false};
            row.set(x, node);
            unvisited.push(node);
        }
    }
    nodes.get(start.y)!.get(start.x)!.cost = 0;
    unvisited.sort(compareByCost);

    // 5. If [...] the smallest tentative distance among the nodes in the unvisited set is infinity
    //    (when planning a complete traversal; occurs when there is no connection between the initial node
    //    and remaining unvisited nodes), then stop. The algorithm has finished.
    while (unvisited.length > 0 && unvisited[0].cost < Infinity) {
        // 6. Otherwise, select the unvisited node that is marked with the smallest tentative distance,
        //    set it as the new "current node", and go back to step 3.
        let current = unvisited[0];

        // 3. For the current node, consider all of its unvisited neighbors and calculate their tentative
        //    distances through the current node. Compare the newly calculated tentative distance to the
        //    current assigned value and assign the smaller one.
        for (let neighbourPosition of getAdjacentPositions(current)) {
            const neighbour = nodes.get(neighbourPosition.y)!.get(neighbourPosition.x)!;
            if (neighbour.visited || isOccupied(dungeon, neighbour)) {
                continue;
            }
            let costThroughCurrent = current.cost + 1;
            if (costThroughCurrent < neighbour.cost) {
                // Found better path through current
                let oldIndex = binarySearch(unvisited, neighbour, compareByCost);
                if (DEBUG) {
                    console.assert(unvisited[oldIndex] === neighbour);
                }
                unvisited.splice(oldIndex, 1);

                neighbour.cost = costThroughCurrent;
                neighbour.prev = current;

                let newIndex = -(binarySearch(unvisited, neighbour, compareByCost) + 1);
                unvisited.splice(newIndex, 0, neighbour);
            }
        }

        // 4. When we are done considering all of the unvisited neighbors of the current node,
        //    mark the current node as visited and remove it from the unvisited set.
        //    A visited node will never be checked again.
        current.visited = true;
        unvisited.shift();
    }

    return nodes;
}

function printPaths(dungeon: Dungeon, nodes: NodeMap) {
    for (let y = 0; y < dungeon.height; y++) {
        let line: string[] = [];
        for (let x = 0; x < dungeon.width; x++) {
            const node = nodes.get(y)!.get(x)!;
            if (node.cost === 0) {
                line.push('0');
            } else if (!node.prev) {
                line.push('#');
            } else if (y === node.prev.y) {
                line.push(x < node.prev.x ? '>' : '<');
            } else if (x === node.prev.x) {
                line.push(y < node.prev.y ? 'v' : '^');
            }
        }
        console.log(line.join(''));
    }
}

function compareByCost(left: Node, right: Node): number {
    return (left.cost - right.cost) || compareByPosition(left, right);
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
