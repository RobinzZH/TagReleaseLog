#!/usr/bin/env node

const program = require('commander');
const signale = require('signale');
const mainFn = require('./index.js');
const {
    version
} = require('../package');

program.version(version);

program.option('-r, --repository [repository]', 'Path for repository');
program.option('-f, --file [file]', 'Path for changelog.md(default to root of repository), e.g. xxx.md', 'changeLog.md');
program.option('-n, --no-save', 'Print only and donot save');
program.option('-h, --head', 'Enable changelog from HEAD');
program.option('-l, --list', 'Generate the change files between tags');


program.command('gen').description('generate changelogs').action(() => {
    program.repository = program.repository || process.cwd();
    mainFn(program).then(result => {
        if (!program.save) {
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
});

program.parse(process.argv);

module.exports = mainFn;
