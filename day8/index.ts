import * as fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

(async () => {
    const input = await readFile('./input', {encoding: 'utf8'});
    const root = parse(input.trim().split(' ').map(x => parseInt(x, 10)));

    part1(root);
    part2(root);
})();

interface Node {
    children: Node[];
    metadata: number[];
}

function parse(input: number[]): Node {
    return parseNode(input, 0).node;
}

function parseNode(input: number[], offset: number): { node: Node, offset: number } {
    let nbChildren = input[offset++];
    let nbMetadata = input[offset++];

    let children: Node[] = [];
    for (let i = 0; i < nbChildren; i++) {
        const child = parseNode(input, offset);
        children.push(child.node);
        offset = child.offset;
    }

    let metadata = input.slice(offset, offset + nbMetadata);
    offset += nbMetadata;

    return {
        node: {children, metadata},
        offset
    };
}

function getNodeSum(node: Node): number {
    let sum = node.metadata.reduce((a, b) => a + b, 0);
    for (const child of node.children) {
        sum += getNodeSum(child);
    }
    return sum;
}

function part1(root: Node) {
    const sum = getNodeSum(root);

    console.log(`Answer to part 1: ${sum}`);
}

function getNodeValue(node: Node): number {
    if (node.children.length === 0) {
        return getNodeSum(node);
    } else {
        let value = 0;
        for (let index of node.metadata) {
            if (1 <= index && index <= node.children.length) {
                value += getNodeValue(node.children[index - 1]);
            }
        }
        return value;
    }
}

function part2(root: Node) {
    const value = getNodeValue(root);

    console.log(`Answer to part 2: ${value}`);
}
