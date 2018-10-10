const spawn = require('child_process').spawn;

module.exports = (path, args) => {
    return new Promise((resolve, reject) => {
        const gitInfo = spawn('git', args, {
            cwd: path || process.cwd(),
            stdio: ['ignore', 'pipe', process.stderr]
        });

        let str = '';
        gitInfo.stdout.on('data', function(data) {
            str += data;
        });

        gitInfo.on('exit', function(code) {
            if (code === 0) {
                resolve(str.trim());
            } else {
                reject(code);
            }
        });
    });
};
