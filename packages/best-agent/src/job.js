import EventEmitter from 'events';
import path from 'path';
import fs from 'fs';
import { cacheDirectory } from '@best/utils';
import { runBenchmark } from '@best/runner';
import tar from 'tar';

const uploadDir = path.join(cacheDirectory('best_agent'), 'uploads');

let counter = 0;

class Job extends EventEmitter {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;
        let { config } = req.params;
        try {
            config = this.config = JSON.parse(config);
        } catch (e) {
            return console.error(`ERROR: Malformed config ${config}`);
        }
        this.id = ++counter;
        this.status = 'QUEUED';

        const cwd = uploadDir;
        const file = `${uploadDir}/${this.id}.tgz`;
        req.pipe(fs.createWriteStream(file))
            .on('close', async () => {
                await tar.x({ cwd, file });
                config.benchmarkEntry = `${cwd}/${config.benchmarkName}.html`;
                this.emit('job:bundle');
            });
    }

    send(event, data) {
        this.res.write(`${event}\t${JSON.stringify(data || null)}\n`);
    }

    async run() {
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
