const SIZE = 300;

(async () => {
    const input = 9306;

    part1(input);
    part2(input);
})();

function getPowerGrid(serial: number): number[][] {
    const grid: number[][] = Array.from(new Array(SIZE), () => new Array(SIZE).fill(0));
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const rackID = (x + 1) + 10;
            let power = rackID * (y + 1);
            power += serial;
            power *= rackID;
            power = Math.floor(power / 100) % 10;
            power -= 5;
            grid[y][x] = power;
        }
    }
    return grid;
}

function part1(serial: number) {
    // Compute power level at every position
    const grid: number[][] = getPowerGrid(serial);

    // Find 3x3 square with largest total power
    let bestX = 0;
    let bestY = 0;
    let bestPower = Number.MIN_SAFE_INTEGER;
    for (let y = 0; y <= SIZE - 3; y++) {
        for (let x = 0; x <= SIZE - 3; x++) {
            let power
                = grid[y][x] + grid[y][x + 1] + grid[y][x + 2]
                + grid[y + 1][x] + grid[y + 1][x + 1] + grid[y + 1][x + 2]
                + grid[y + 2][x] + grid[y + 2][x + 1] + grid[y + 2][x + 2];
            if (power > bestPower) {
                bestX = x + 1;
                bestY = y + 1;
                bestPower = power;
            }
        }
    }

    console.log(`At ${bestX},${bestY} with ${bestPower} power`);
    console.log(`Answer to part 1: ${bestX},${bestY}`);
}

function part2(serial: number) {
    // Compute power level at every position
    const grid: number[][] = getPowerGrid(serial);

    // Find NxN square with largest total power
    let bestX = 0;
    let bestY = 0;
    let bestN = 0;
    let bestPower = Number.MIN_SAFE_INTEGER;
    for (let n = 3; n <= SIZE; n++) {
        for (let y = 0; y <= SIZE - n; y++) {
            for (let x = 0; x <= SIZE - n; x++) {
                // TODO Optimize?
                let power = 0;
                for (let sy = y; sy < y + n; sy++) {
                    for (let sx = x; sx < x + n; sx++) {
                        power += grid[sy][sx];
                    }
                }

                if (power > bestPower) {
                    bestX = x + 1;
                    bestY = y + 1;
                    bestN = n;
                    bestPower = power;
                }
            }
        }
    }

    console.log(`Square with size ${bestN} at ${bestX},${bestY} has ${bestPower} power`);
    console.log(`Answer to part 2: ${bestX},${bestY},${bestN}`);
}

export {};
