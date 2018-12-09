import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const ids = input.trim().split('\n');
    for (let i = 0; i < ids.length; i++) {
        const id1 = ids[i];
        for (let j = i + 1; j < ids.length; j++) {
            const id2 = ids[j];
            let differences = 0;
            for (let k = 0; k < id1.length && differences <= 1; k++) {
                if (id1[k] !== id2[k]) {
                    differences += 1;
                }
            }
            if (differences === 1) {
                for (let k = 0; k < id1.length; k++) {
                    if (id1[k] !== id2[k]) {
                        console.log('Found match!');
                        console.log(`id1:\t${id1}`);
                        console.log(`id2:\t${id2}`);
                        console.log(`common:\t${id1.slice(0, k)}${id1.slice(k + 1)}`);
                        return;
                    }
                }
            }
        }
    }
    console.error('No match!');
})();
