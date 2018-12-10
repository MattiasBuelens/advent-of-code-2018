import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

interface Dependency {
    required: string;
    dependent: string;
}

type DependencyGraph = Map<string, Set<string>>;

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const dependencies: Dependency[] = input
        .trim()
        .split('\n')
        .map(line => {
            const [_, required, dependent] = line.match(/^Step (\w) must be finished before step (\w) can begin\.$/)!;
            return {required, dependent};
        });

    const dependencyGraph = buildDependencyGraph(dependencies);
    // for (let [step, requires] of dependencyGraph.entries()) {
    //     console.log(`Step ${step} depends on ${[...requires].join(',')}`);
    // }

    part1(dependencyGraph);
})();

function part1(dependencyGraph: DependencyGraph) {
    let completed = new Set<string>([]);
    let queue = new Set<string>(dependencyGraph.keys());
    outer: while (queue.size > 0) {
        for (let step of queue) {
            if (containsAll(completed, dependencyGraph.get(step)!)) {
                // All required step have been completed
                // Perform this step now
                completed.add(step);
                queue.delete(step);
                continue outer;
            }
        }
        throw new Error('No step is available!');
    }

    console.log(`Answer to part 1: ${[...completed].join('')}`);
}

function buildDependencyGraph(dependencies: Dependency[]): DependencyGraph {
    // Names of all steps in alphabetical order
    const steps = [
        ...dependencies.map(dep => dep.required),
        ...dependencies.map(dep => dep.dependent)
    ].sort();

    // Map of every step to all steps that it directly depends on
    const graph = new Map<string, Set<string>>();
    for (let step of steps) {
        graph.set(step, new Set<string>());
    }
    for (let {required, dependent} of dependencies) {
        graph.get(dependent)!.add(required);
    }

    return graph;
}

function containsAll<T>(set: Set<T>, subset: Set<T>): boolean {
    for (let element of subset) {
        if (!set.has(element)) {
            return false;
        }
    }
    return true;
}
