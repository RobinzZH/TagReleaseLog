#!/usr/bin/env node

const processArgs = require('./src/process.args.js');
const path = require('path');
const main = require('./src/main.js');
const cwd = process.cwd();

let source = cwd;
if (typeof processArgs.config === 'string') {
    source = path.resolve(cwd, processArgs.config);
}

console.log(`Generate change @Folder: ${source}`);

main({
    path: source
});
