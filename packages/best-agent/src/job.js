import EventEmitter from 'events';
import fs from 'fs';
import { cacheDirectory } from '@best/utils';
import { runBenchmark } from '@best/runner';
import tar from 'tar';

const cacheDir = cacheDirectory('best_agent');
fs.mkdirSync(cacheDir);

let counter = 0;

class Job extends EventEmitter {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        let { config } = req.params;
        try {
            config = this.config = JSON.parse(config);
            config.benchmarkEntry = `${cacheDir}/${config.benchmarkName}.html`;
        } catch (e) {
            return console.error(`ERROR: Malformed config ${config}`);
        }
        this.id = ++counter;

        req.pipe(fs.createWriteStream(`${cacheDir}/${this.id}.tgz`))
            .on('end', () => this.emit('job:uploaded'));
    }

    send(event, data) {
        this.res.write(`${event}\t${JSON.stringify(data || null)}\n`);
    }

    async run() {
        await tar.x({ cwd: cacheDir, file: `${this.id}.tgz` });
        const send = this.send.bind(this);
        const results = await runBenchmark(this.config, {
            onBenchmarkStart() {
                send('benchmark:start');
            },
            updateBenchmarkProgress(state, opts) {
                send('benchmark:update', { state, opts });
            },
            onBenchmarkEnd() {
                send('benchmark:end');
            },
            onBenchmarkError(error) {
                send('benchmark:error', error);
            },
        });
        send('benchmark:results', results);
        this.res.end();
        this.emit('job:end');
    }
}

export default Job;
