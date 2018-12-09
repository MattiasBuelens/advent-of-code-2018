import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const lines = input.trim().split('\n');
    lines.sort(); // sort by timestamp

    const records = analyze(lines);
    part1(records);
    part2(records);
})();

function analyze(lines: string[]): Map<number, number[]> {
    // Key: guard ID
    // Value: array of length 60, each element is the number of times the guard was asleep at that minute
    const records = new Map<number, number[]>();

    let currentGuard = 0;
    let sleepStart = 0;
    for (let line of lines) {
        const [_, minute, guardBeginningShift, fallsAsleep, wakesUp] =
            line.match(/^\[\d{4}-\d{2}-\d{2} \d{2}:(\d{2})\] (?:Guard #(\d+) begins shift|(falls asleep)|(wakes up))$/)!;
        if (guardBeginningShift) {
            currentGuard = parseInt(guardBeginningShift, 10);
            if (!records.has(currentGuard)) {
                records.set(currentGuard, new Array(60).fill(0));
            }
        }
        if (fallsAsleep) {
            sleepStart = parseInt(minute, 10);
        }
        if (wakesUp) {
            const sleepEnd = parseInt(minute, 10);
            const record = records.get(currentGuard)!;
            for (let i = sleepStart; i < sleepEnd; i++) {
                record[i] += 1;
            }
        }
    }

    return records;
}

function part1(records: Map<number, number[]>) {
    // Find the sleepiest guard, i.e. the guard that has the most minutes asleep
    let sleepiestGuard = 0;
    let sleepiestTotal = 0;
    for (let [guard, record] of records.entries()) {
        const total = record.reduce((x, y) => x + y, 0);
        if (total > sleepiestTotal) {
            sleepiestGuard = guard;
            sleepiestTotal = total;
        }
    }

    // Find the minute where the sleepiest guard is most often asleep
    let sleepiestMinute = 0;
    const sleepiestRecord = records.get(sleepiestGuard)!;
    for (let minute = 0; minute < 60; minute++) {
        if (sleepiestRecord[minute] > sleepiestRecord[sleepiestMinute]) {
            sleepiestMinute = minute;
        }
    }

    console.log(`Sleepiest guard: #${sleepiestGuard}`);
    console.log(`Total minutes asleep: ${sleepiestTotal}`);
    console.log(`Most often asleep at 00:${sleepiestMinute.toString(10).padStart(2, '0')}`);
    console.log(`Answer to part 1: ${sleepiestGuard * sleepiestMinute}`);
}

function part2(records: Map<number, number[]>) {
    // Find the guard that is the most often asleep on the same minute
    let sleepiestMinute = 0;
    let sleepiestFrequency = 0;
    let sleepiestGuard = 0;

    for (let [guard, record] of records.entries()) {
        for (let minute = 0; minute < 60; minute++) {
            if (record[minute] > sleepiestFrequency) {
                sleepiestFrequency = record[minute];
                sleepiestMinute = minute;
                sleepiestGuard = guard;
            }
        }
    }

    console.log(`Guard #${sleepiestGuard} was ${sleepiestFrequency} times asleep ` +
        `at 00:${sleepiestMinute.toString(10).padStart(2, '0')}`);
    console.log(`Answer to part 2: ${sleepiestGuard * sleepiestMinute}`);
}
