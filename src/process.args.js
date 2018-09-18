const args = {};
let i;

// 解析进程参数
for (i = 2; i < process.argv.length; i++) {
    const res = /^(.+)=(.+)$/.exec(process.argv[i]);

    if (res) {
        args[res[1]] = res[2];
    }
}

module.exports = args;
