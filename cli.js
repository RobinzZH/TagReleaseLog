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

program.option('-s, --source <source>', 'Path for source code');
program.option('-h, --head', 'Enable changelog from HEAD');
program.option('-p, --path <path>', 'Path for changelog.md(default to root of source code), e.g. xxx.md');
program.option('-l, --list', 'List the changelog between tags');

program.parse(process.argv);

let source = cwd;
let logFile = cwd;

if (program.source) {
    source = path.resolve(cwd, program.source);
}

if (program.path) {
    logFile = path.resolve(cwd, program.path);

    const extname = path.extname(logFile);
    if (extname) {
        if (!extname === '.md') {
            logFile = path.join(path.resolve(logFile, '../'), './changeLog.md');
        }
    } else {
        logFile = path.join(logFile, './changeLog.md');
    }
} else {
    logFile = path.resolve(source, './changeLog.md');
}

signale.note(`Generate change @Folder: ${source}`);

main({
    path: source,
    LogFile: logFile,
    appendHEAD: program.head,
    genEachLog: program.list
});
