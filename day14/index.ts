const DEBUG = false;

(async () => {
    const input = 894501;

    part1(input);
    part2(input);
})();

function part1(recipesOffset: number) {
    let recipes: number[] = [3, 7];
    let current: number[] = [0, 1];

    while (recipes.length < recipesOffset + 10) {
        tick(recipes, current);
    }
    if (DEBUG) {
        printState(recipes, current);
    }

    const recipesAfterOffset = recipes.slice(recipesOffset, recipesOffset + 10);
    console.log(`Answer to part 1: ${recipesAfterOffset.join('')}`);
}

function part2(target: number) {
    let targetRecipes = target.toString(10).split('').map(Number);
    let recipes: number[] = [3, 7];
    let current: number[] = [0, 1];
    let matchIndex: number;

    while ((matchIndex = matches(recipes, targetRecipes)) === -1) {
        tick(recipes, current);
    }

    console.log(`Answer to part 2: ${matchIndex}`);
}

function tick(recipes: number[], current: number[]) {
    const sum = current.reduce((sum, recipeIndex) => sum + recipes[recipeIndex], 0);
    // We only have two elves with two current recipes, so the sum of those recipes is <= 18 (= 9 + 9)
    if (sum < 10) {
        recipes.push(sum);
    } else {
        recipes.push(Math.floor(sum / 10));
        recipes.push(sum % 10);
    }

    for (let i = 0; i < current.length; i++) {
        current[i] = (current[i] + 1 + recipes[current[i]]) % recipes.length;
    }
}

function matches<T>(haystack: T[], needle: T[]): number {
    // We add at most two new recipes per tick
    // Only check for new matches near the tail
    outer: for (let offset = 0; offset < 2; offset++) {
        let i = haystack.length - needle.length - offset;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                continue outer;
            }
        }
        return i;
    }
    return -1;
}

function printState(recipes: number[], current: number[]) {
    let parts: string[] = [];
    for (let i = 0; i < recipes.length; i++) {
        const recipe = recipes[i];
        let part = '';
        for (let j = 0; j < current.length; j++) {
            if (current[j] === i) {
                part += `${String.fromCharCode('A'.charCodeAt(0) + j)}:`;
            }
        }
        part += recipe;
        parts.push(part);
    }
    console.log(parts.join(' '));
}
