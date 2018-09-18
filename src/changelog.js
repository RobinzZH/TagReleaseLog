const fs = require('fs');
const releaseNotes = require('@redshelf/git-release-notes');
const TEMPLATE = `${__dirname}/markdown.ejs`;
const signale = require('signale');

module.exports = (path, RANGE) => {

    signale.note('start create result folder');
    mkdir('./result');
    signale.note('finish create result folder');

    return new Promise((resolve, reject) => {
        releaseNotes({
            path: path
        }, RANGE, TEMPLATE)
            .then((changelog) => {
                signale.complete(`Changelog finished between ${RANGE}\n`);
                fs.writeFileSync(`./result/changelog-${RANGE}.md`, `${changelog}`);
                resolve(changelog);
            })
            .catch((ex) => {
                if (String(ex).indexOf('Error: No commits in the specified range') === 0) {
                    signale.fatal(`No commits in the specified range ${RANGE}\n`);
                } else {
                    signale.fatal(ex);
                }
                reject(ex);
            });
    });
};

const mkdir = curr => {
    if (!fs.existsSync(curr)) {
        signale.debug('[result_dir]', `mkdir : ${curr}`);
        fs.mkdirSync(curr, 0o777);
    }
};
