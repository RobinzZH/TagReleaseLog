const path = require('path');
const fs = require('fs');
const signale = require('signale');
const gitCmd = require('./gitCmd.js');
const changelog = require('./changelog.js');
const cwd = process.cwd();

/**
 * Generate changelog
 * @param {object} config
 * @param {string} config.repository
 * @param {boolean} config.head enable the changelog from HEAD
 * @param {boolean} config.save save changelog.md or print only
 * @param {boolean} config.list generate the change files between tags
 * @param {string} config.file changelog file name/pathname
 */
module.exports = async (config = {}) => {

    if (!config.repository) {
        throw new Error('Repository is required');
    } else {
        const source = path.resolve(cwd, config.repository);
        if (!fs.existsSync(source)) {
            throw new Error(`Repository (${config.repository}) doesnot exist, please check again.`);
        } else {
            config.repository = source;
        }
    }

    signale.note(`Generate change @Folder: ${config.repository}`);

    const url = await gitCmd(config.repository, ['ls-remote', '--get-url']).catch(err => {
        throw new Error(`fetch git info fail by code : ${err}`);
    });
    global.commitHref = config.commitHref = url.replace('.git', '/commit/');
    if (url.indexOf('github') >= 0) {
        global.tagHref = config.tagHref = url.replace('.git', '/releases/tag/');
    } else {
        global.tagHref = config.tagHref = url.replace('.git', '/commits/');
    }


    signale.star(`fetch the tags from repository:${config.repository}`);

    const splitStr = '_**_';

    const trimStr = await gitCmd(config.repository, ['log', '--tags', '--no-walk', `--pretty="%ai${splitStr}%h${splitStr}%D"`]).catch(err => {
        throw new Error(`fetch git tag fail by code : ${err}`);
    });

    const tagSplitStr = 'tag: ';

    if (!trimStr) {
        throw new Error('empty tags info.');
    }

    const list = trimStr.split('\n');

    signale.debug(`tag list result(${list.length}): ${JSON.stringify(list, null, 4)}`);

    let tags = [];
    for (let i = 0; i < list.length; i++) {
        list[i] = list[i].slice(1, list[i].length - 1);
        const arr = list[i].split(splitStr);
        let match = false;
        if (arr[2]) {
            if (arr[2].split(', ').length > 1) {
                const refs = arr[2].split(', ');
                for (let j = 0; j < refs.length; j++) {
                    if (refs[j].indexOf(tagSplitStr) === 0) {
                        arr[2] = refs[j].slice(tagSplitStr.length);
                        match = true;
                        break;
                    } else {
                        continue;
                    }
                }
            } else {
                match = true;
                arr[2] = arr[2].slice(tagSplitStr.length);
            }
            if (match) {
                tags.push({
                    date: new Date(arr[0]),
                    hash: arr[1],
                    name: arr[2]
                });
            }
        }
    }

    tags.sort((a, b) => {
        return a.date.getTime() - b.date.getTime();
    });

    if (config.head) {
        tags = tags.concat({
            date: new Date(),
            hash: null,
            name: 'HEAD'
        });
    }

    const tagsLen = tags.length;

    if (tagsLen === 0 || config.head && tagsLen === 1) {
        throw new Error('Changelog does need at least 2 tags.');
    }

    signale.star(`fetch the changelog for tags(${tagsLen})`);
    const result = [];
    for (let i = 0; i < tagsLen - 1; i++) {
        signale.watch(`start: ${tags[i].name} - ${tags[i + 1].name}`);
        result.push([tags[i + 1], await changelog(config.repository, tags[i].name + '..' + tags[i + 1].name, config.list).then(d => d).catch(() => '')]);
    }

    signale.complete('finish changelog');

    signale.star('format the changelog for tags:');

    const changeLogs = result.reverse();

    let mdContent = '# ChangeLog\n\n';

    for (let i = 0; i < changeLogs.length; i++) {
        if (changeLogs[i][1]) {
            if (config.tagHref) {
                mdContent += `## [${dateFormat(changeLogs[i][0].date)}, Version  ${changeLogs[i][0].name}](${config.tagHref}${changeLogs[i][0].name})\n\n${changeLogs[i][1]}\n\n\n`;
            } else {
                mdContent += `## ${dateFormat(changeLogs[i][0].date)}, Version  ${changeLogs[i][0].name}\n\n${changeLogs[i][1]}\n\n\n`;
            }
        }
    }

    if (config.save && config.file) {
        signale.star('write file');
        config.file = path.resolve(cwd, config.file);
        const folder = path.resolve(config.file, '../');
        if (!fs.existsSync(folder)) {
            throw new Error(`changelog folder (${folder}) doesnot exist, please check again.`);
        }
        fs.writeFileSync(config.file, `${mdContent}`);
    }

    signale.success('finish');

    return mdContent;
};

const dateFormat = d => {
    return [d.getFullYear(), numFixed(d.getMonth() + 1), numFixed(d.getDate())].join('-');
};

const numFixed = i => {
    if (i > 9) return String(i);
    return '0' + i;
};
