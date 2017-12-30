import childProcess from 'child_process';

export async function addGitInformation(options) {
    const cwd = options.rootDir;
    const hash = await getCurrentHash(cwd);
    const localChanges = await hasLocalChanges(cwd);
    console.log('>>> ', hash, localChanges);
    return options;
}

export async function getCurrentHash(cwd) {
    return new Promise((resolve, reject) => {
        const args = ["log", "--pretty=format:'%h'", "-n", "1"];
        const child = childProcess.spawn('git', args, { cwd });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => (stdout += data));
        child.stderr.on('data', data => (stderr += data));
        child.on('error', e => reject(e));
        child.on('close', code => {
            if (code === 0) {
                stdout = stdout.trim();
                if (stdout === '') {
                    resolve([]);
                } else {
                    resolve(stdout);
                }
            } else {
                reject(code + ': ' + stderr);
            }
        });
    });
}

function hasLocalChanges(cwd) {
    return new Promise((resolve, reject) => {
        const args = ["diff", "--no-ext-diff", "--quiet"];
        const child = childProcess.spawn('git', args, { cwd });
        child.on('error', e => reject(e));
        child.on('close', code => resolve(code === 1));
    });
}


