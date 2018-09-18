const gitCmd = require('./gitCmd.js');
const changelog = require('./changelog.js');
const path = require('path');
const fs = require('fs');

module.exports = async (config = {}) => {

    if (!config.path) {
        console.error('[check]', 'source path is required, pls update conf/config.js.');
        process.exit(1);
    } else {
        const source = path.resolve(config.path);
        if (!fs.existsSync(source)) {
            console.error('[check]', `source path (${config.path}) doesnot exist, please check again.`);
            process.exit(1);
        } else {
            config.path = source;
        }
    }

    if (config.commitHref && config.tagHref) {
        global.commitHref = config.commitHref;
    } else {
        const url = await gitCmd(config.path, ['ls-remote', '--get-url']).catch(err => {
            console.error('[git]', `fetch git info fail by code : ${err}`);
            process.exit(1);
        });
        global.commitHref = config.commitHref = url.replace('.git', '/commit/');
        if (url.indexOf('github') >= 0) {
            global.tagHref = config.tagHref = url.replace('.git', '/releases/tag/');
        } else {
            global.tagHref = config.tagHref = url.replace('.git', '/commits/');
        }
    }

    console.log('[gitTags]', `fetch the tags from project:${config.path}`);

    const splitStr = '_**_';

    const trimStr = await gitCmd(config.path, ['log', '--tags', '--no-walk', `--pretty="%ai${splitStr}%h${splitStr}%D"`]).catch(err => {
        console.error('[gitTags]', `fetch git tag fail by code : ${err}`);
        process.exit(1);
    });

    const tagSplitStr = 'tag: ';

    if (!trimStr) {
        console.error('[git]', 'empty tags info.');
        process.exit(1);
    }

    const list = trimStr.split('\n');

    console.log('[parseTag]', `tag list result(${list.length}): ${JSON.stringify(list, null, 4)}`);

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
        console.log('project does not have any tag');
        process.exit(0);
        return;
    }

    console.log('[index]', `fetch the changelog for tags(${tagsLen})`);
    const result = [];
    for (let i = 0; i < tagsLen - 1; i++) {
        console.log('[changelog]', `start: ${tags[i].name} - ${tags[i + 1].name}`);
        result.push([tags[i + 1], await changelog(config.path, tags[i].name + '..' + tags[i + 1].name).then(d => d).catch(() => '')]);
    }

    console.log('[index]', 'format the changelog for tags:');

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

    console.log('[index]', 'finish');
};

const dateFormat = d => {
    return [d.getFullYear(), numFixed(d.getMonth() + 1), numFixed(d.getDate())].join('-');
};

const numFixed = i => {
    if (i > 9) return String(i);
    return '0' + i;
};
