const fs = require('fs');
const releaseNotes = require('@redshelf/git-release-notes');
const TEMPLATE = `${__dirname}/markdown.ejs`;

module.exports = (path, RANGE) => {

    console.log('[changelog]', 'start create result folder');
    mkdir('./result');
    console.log('[changelog]', 'finish create result folder');

    return new Promise((resolve, reject) => {
        releaseNotes({
            path: path
        }, RANGE, TEMPLATE)
            .then((changelog) => {
                console.log('[changelog]', `Changelog finished between ${RANGE}\n`);
                fs.writeFileSync(`./result/changelog-${RANGE}.md`, `${changelog}`);
                resolve(changelog);
            })
            .catch((ex) => {
                if (String(ex).indexOf('Error: No commits in the specified range') === 0) {
                    console.log('[changelog]', `No commits in the specified range ${RANGE}\n`);
                } else {
                    console.error(ex);
                }
                reject(ex);
            });
    });
};

const mkdir = curr => {
    if (!fs.existsSync(curr)) {
        console.log('[result_dir]', `mkdir : ${curr}`);
        fs.mkdirSync(curr, 0o777);
    }
};
