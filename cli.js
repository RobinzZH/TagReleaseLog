#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const signale = require('signale');
const main = require('./src/main.js');
const cwd = process.cwd();
const {
    version
} = require('./package');

program.version(version);

program.parse(process.argv);

let source = cwd;

if (typeof program.args[0] === 'string') {
    source = path.resolve(cwd, program.args[0]);
}

signale.note(`Generate change @Folder: ${source}`);

main({
    path: source
});
