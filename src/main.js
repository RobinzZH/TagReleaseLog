const path = require('path');
const fs = require('fs');
const signale = require('signale');
const gitCmd = require('./gitCmd.js');
const changelog = require('./changelog.js');

module.exports = async (config = {}) => {

    if (!config.path) {
        signale.error('source path is required, pls update conf/config.js.');
        process.exit(1);
    } else {
        const source = path.resolve(config.path);
        if (!fs.existsSync(source)) {
            signale.error(`source path (${config.path}) doesnot exist, please check again.`);
            process.exit(1);
        } else {
            config.path = source;
        }
    }

    if (config.commitHref && config.tagHref) {
        global.commitHref = config.commitHref;
    } else {
        const url = await gitCmd(config.path, ['ls-remote', '--get-url']).catch(err => {
            signale.error(`fetch git info fail by code : ${err}`);
            process.exit(1);
        });
        global.commitHref = config.commitHref = url.replace('.git', '/commit/');
        if (url.indexOf('github') >= 0) {
            global.tagHref = config.tagHref = url.replace('.git', '/releases/tag/');
        } else {
            global.tagHref = config.tagHref = url.replace('.git', '/commits/');
        }
    }

    signale.star(`fetch the tags from project:${config.path}`);

    const splitStr = '_**_';

    const trimStr = await gitCmd(config.path, ['log', '--tags', '--no-walk', `--pretty="%ai${splitStr}%h${splitStr}%D"`]).catch(err => {
        signale.error(`fetch git tag fail by code : ${err}`);
        process.exit(1);
    });

    const tagSplitStr = 'tag: ';

    if (!trimStr) {
        signale.error('empty tags info.');
        process.exit(1);
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

    tags = tags.concat({
        date: new Date(),
        hash: null,
        name: 'HEAD'
    });

    const tagsLen = tags.length;

    if (tagsLen === 1) {
        signale.success('project does not have any tag');
        process.exit(0);
        return;
    }

    signale.star(`fetch the changelog for tags(${tagsLen})`);
    const result = [];
    for (let i = 0; i < tagsLen - 1; i++) {
        signale.watch(`start: ${tags[i].name} - ${tags[i + 1].name}`);
        result.push([tags[i + 1], await changelog(config.path, tags[i].name + '..' + tags[i + 1].name).then(d => d).catch(() => '')]);
    }

    signale.complete('finish changelog');

    signale.star('format the changelog for tags:');

    const changeLogs = result.reverse();

    const file = path.join(config.path, './changeLog.md');

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
    fs.writeFileSync(file, `${mdContent}`);

    signale.success('finish');
};

const dateFormat = d => {
    return [d.getFullYear(), numFixed(d.getMonth() + 1), numFixed(d.getDate())].join('-');
};

const numFixed = i => {
    if (i > 9) return String(i);
    return '0' + i;
};