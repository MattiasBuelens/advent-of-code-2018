import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    let result = 0;
    for (let line of input.trim().split('\n')) {
        result += parseInt(line, 10);
    }
    console.log(result);
})();
