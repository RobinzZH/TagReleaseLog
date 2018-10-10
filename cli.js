#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const signale = require('signale');
const mainFn = require('./src/main.js');
const cwd = process.cwd();
const {
    version
} = require('./package');

program.version(version);

program.option('-o, --only', 'Print only');
program.option('-r, --repository <repository>', 'Path for repository');
program.option('-h, --head', 'Enable changelog from HEAD');
program.option('-p, --path <path>', 'Path for changelog.md(default to root of repository), e.g. xxx.md');
program.option('-l, --list', 'List the changelog between tags');

program.parse(process.argv);

let repository = cwd;
let logFile = cwd;

if (program.repository) {
    repository = path.resolve(cwd, program.repository);
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
    logFile = path.resolve(repository, './changeLog.md');
}

signale.note(`Generate change @Folder: ${repository}`);

mainFn({
    save: !program.only,
    path: repository,
    LogFile: logFile,
    appendHEAD: program.head,
    genEachLog: program.list
}).then(result => {
    if (program.only) {
        console.log('========================================================');
        console.log(result);
        console.log('========================================================');
    }
    process.exit(0);
}).catch(err => {
    if (err.message) {
        signale.error(err.message);
    } else {
        signale.error(err);
    }
    process.exit(1);
});
