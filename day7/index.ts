import * as fs from 'fs';
import {promisify} from 'util';

const DEBUG = true;

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
    if (DEBUG) {
        for (let [step, requires] of dependencyGraph.entries()) {
            console.log(`Step ${step} depends on ${[...requires].join(',')}`);
        }
    }

    part1(dependencyGraph);
    part2(dependencyGraph);
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

type WorkerState = {
    working: false;
} | {
    working: true;
    step: string;
    timeLeft: number;
}

const NB_WORKERS = 5;
const WORK_DELAY = 60 + 1 - 'A'.charCodeAt(0);

function part2(dependencyGraph: DependencyGraph) {
    let queue = new Set<string>(dependencyGraph.keys());
    let state = new Array<WorkerState>(NB_WORKERS);
    let completed = new Set<string>([]);
    for (let worker = 0; worker < NB_WORKERS; worker++) {
        state[worker] = {working: false};
    }

    if (DEBUG) {
        let header = '#\t';
        for (let worker = 0; worker < NB_WORKERS; worker++) {
            header += `W${worker}\t`;
        }
        header += 'Completed';
        console.log(header);
    }

    let time = 0;
    while (queue.size > 0 || state.some(x => x.working)) {
        for (let worker = 0; worker < NB_WORKERS; worker++) {
            let workerState = state[worker];
            if (workerState.working) {
                // Make progress on current step
                workerState.timeLeft -= 1;
                if (workerState.timeLeft === 0) {
                    // Done with this step
                    completed.add(workerState.step);
                    state[worker] = workerState = {working: false};
                }
            }
            if (!workerState.working) {
                // Find new step to work on
                for (let step of queue) {
                    if (containsAll(completed, dependencyGraph.get(step)!)) {
                        // All required step have been completed
                        // Step 'A' takes 60+1 seconds
                        const timeLeft = step.charCodeAt(0) + WORK_DELAY;
                        workerState = {working: true, step, timeLeft};
                        break;
                    }
                }
                if (workerState.working) {
                    // Start working on new step
                    queue.delete(workerState.step);
                    state[worker] = workerState;
                }
            }
        }

        if (DEBUG) {
            let line = `${time}\t`;
            for (let workerState of state) {
                line += `${workerState.working ? workerState.step : '.'}\t`;
            }
            line += `${[...completed].join('')}`;
            console.log(line);
        }

        // Tick... tock...
        time += 1;
    }

    console.log(`Answer to part 2: ${time - 2}`); // FIXME off by two?
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
