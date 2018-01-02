import childProcess from 'child_process';

async function getCurrentHash(cwd) {
    return new Promise((resolve, reject) => {
        const args = ["log", "--pretty=format:%h", "-n", "1"];
        const child = childProcess.spawn('git', args, { cwd });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => (stdout += data));
        child.stderr.on('data', data => (stderr += data));
        child.on('error', e => reject(e));
        child.on('close', code => {
            if (code === 0) {
                resolve(stdout.trim());
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

export async function addGitInformation(options) {
    const cwd = options.rootDir;
    const [hash, localChanges] = await Promise.all([getCurrentHash(cwd), hasLocalChanges(cwd)]);

    options.gitCommit = hash;
    options.gitLocalChanges = localChanges;
    return options;
}
