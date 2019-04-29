import EventEmitter from 'events';
import fs from 'fs';
import { cacheDirectory } from '@best/utils';
import { runBenchmark } from '@best/runner';
import tar from 'tar';

// Ensure the cache directory exists.
const cacheDir = cacheDirectory('best-agent');
fs.mkdir(cacheDir, () => {});

let nextId = 0;

class Job extends EventEmitter {
    constructor(req, res) {
        super();
        this.req = req;
        this.res = res;

        // Wait to be dequeued.
        this.isRunning = false;

        // Set up a messager before parsing config, in case of config errors.
        this.messager = {
            onBenchmarkStart: () => this.send('benchmark:start'),
            updateBenchmarkProgress: (state, opts) => this.send('benchmark:update', { state, opts }),
            onBenchmarkEnd: () => this.send('benchmark:end'),
            onBenchmarkError: (error) => this.send('benchmark:error', error),
        };

        // Parse configuration.
        let { config } = req.params;
        try {
            config = this.config = JSON.parse(config);
            config.benchmarkEntry = `${cacheDir}/${config.benchmarkName}.html`;
        } catch (err) {
            this.end(err);
        }

        // Prevent response timeout.
        this.send('job:connected');

        // eslint-disable-next-line lwc/no-set-interval
        this.pulse = setInterval(() => this.send('pulse'), 5e4); // Prevent 55-second rolling timeouts on Heroku.
        this.timeout = setTimeout(() => this.end(new Error('Timed out.')), 36e5); // Give up after 1 hour.

        // Receive the new bundle upload.
        this.id = nextId++;
        this.file = `${cacheDir}/${this.id}.tgz`;
        req.pipe(fs.createWriteStream(this.file))
            .on('close', () => this.emit('job:uploaded'))
            .on('error', err => this.end(err));
    }

    // Unzip the bundle and run benchmarks.
    async run() {
        this.isRunning = true;
        try {
            await tar.x({ cwd: cacheDir, file: this.file });
            const results = await runBenchmark(this.config, this.messager);
            this.send('benchmark:results', results);
            this.end();
        } catch (err) {
            this.end(err);
        }
    }

    // Write to the newline-delimited response stream.
    send(event, data) {
        this.res.write(`${event}\t${JSON.stringify(data || null)}\n`);
    }

    // End the response, whether successful or not.
    end(err) {
        if (err) {
            console.error(err);
            this.messager.onBenchmarkError(err.stack);
        }
        clearInterval(this.pulse);
        clearTimeout(this.timeout);

        // Disconnect the client.
        this.res.end();

        // Tell the server this job has stopped running.
        if (this.isRunning) {
            this.emit('job:finished');
        }

        // Delete the bundle tarball.
        fs.unlink(this.file, () => {});

        // TODO: Clear the cacheDir?
    }
}

export default Job;
