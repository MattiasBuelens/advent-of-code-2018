import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const changes = input.trim().split('\n').map(x => parseInt(x, 10));
    let frequency = 0;
    let seen = new Set<number>();
    while (true) {
        for (let change of changes) {
            frequency += change;
            if (seen.has(frequency)) {
                console.log(frequency);
                return;
            } else {
                seen.add(frequency);
            }
        }
    }
})();
