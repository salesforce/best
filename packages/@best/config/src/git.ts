import childProcess from 'child_process';

async function getCurrentHash(cwd: string):Promise<string> {
    return new Promise((resolve, reject) => {
        const args = ['log', '--pretty=format:%h', '-n', '1'];
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

async function getDateOfCurrentHash(cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const args = ['log', '--pretty=format:%cd', '-n', '1'];
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
    })
}

function hasLocalChanges(cwd: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const args = ['diff', '--no-ext-diff', '--quiet'];
        const child = childProcess.spawn('git', args, { cwd });
        child.on('error', e => reject(e));
        child.on('close', code => resolve(code === 1));
    });
}

function getBranch(cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const args = ['rev-parse', '--abbrev-ref', 'HEAD'];
        const child = childProcess.spawn('git', args, { cwd });
        let stdout = '';
        child.stdout.on('data', data => (stdout += data));
        child.on('error', e => reject(e));
        child.on('close', () => resolve(stdout.trim()));
    });
}

function getRepository(cwd: string): Promise<{ owner: string, repo: string }> {
    return new Promise((resolve, reject) => {
        const args = ['ls-remote', '--get-url'];
        const child = childProcess.spawn('git', args, { cwd });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', data => (stdout += data));
        child.stderr.on('data', data => (stderr += data));
        child.on('error', e => reject(e));
        child.on('close', code => {
            if (code === 0) {
                const rawValue = stdout.trim();
                const [owner, repo] = rawValue
                    .split(':')
                    .pop()!
                    .split('.git')[0]
                    .split('/');
                resolve({ owner, repo });
            } else {
                reject(code + ': ' + stderr);
            }
        });
    });
}

interface GitOptions {
    rootDir?: string,
}

export async function addGitInformation(options: GitOptions) {
    const cwd = options.rootDir;
    if (cwd) {
        const [gitCommit, gitCommitDate, gitLocalChanges, gitBranch, gitRepository] = await Promise.all([
            getCurrentHash(cwd),
            getDateOfCurrentHash(cwd),
            hasLocalChanges(cwd),
            getBranch(cwd),
            getRepository(cwd),
        ]);

        return Object.assign(options, { gitCommit, gitCommitDate, gitLocalChanges, gitBranch, gitRepository });
    }
}
