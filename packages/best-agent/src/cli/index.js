import express from 'express';
import { readFileSync } from 'fs';
import Job from '../job';

const { env } = process;
const PORT = env.PORT || 5000;
const SSL_PFX_FILE = env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = env.SSL_PFX_PASSPHRASE;
const CONCURRENCY = parseInt(env.CONCURRENCY, 10) || 1;

if (CONCURRENCY > 1) {
    console.warn(`WARNING: Running ${CONCURRENCY} concurrent agents affects browser performance and is intended for development environments only.`);
}

export function run() {
    const app = express();
    const ssl = SSL_PFX_FILE && SSL_PFX_PASSPHRASE;
    const protocol = ssl ? 'https' : 'http';
    const lib = require(protocol);
    const server = ssl
        ? lib.createServer({
            pfx: readFileSync(SSL_PFX_FILE),
            passphrase: SSL_PFX_PASSPHRASE
        }, app)
        : lib.createServer(app);

    server.listen(PORT);

    const queue = [];
    let runningCount = 0;

    app.get('/', (req, res) => res.send('BEST agent running!'));

    app.post('/job/:config', (req, res) => {
        const job = new Job(req, res);
        console.log(`Receiving job ${job.id}`);
        job.on('job:bundle', () => {
            console.log(`Received job ${job.id}`);
            queue.push(job);
            if (runNextJob() !== job) {
                job.send('job:queued', { pending: queue.length - 1 });
            }
        });
        job.on('job:end', () => {
            console.log(`Finished job ${job.id}`);
            runningCount--;
            runNextJob();
        });
    });

    function runNextJob() {
        const job = runningCount < CONCURRENCY ? queue.shift() : null;
        if (job) {
            console.log(`Running job ${job.id}`);
            job.run();
            runningCount++;
        }
        return !!job;
    }

    console.log(`BEST agent listening at ${protocol}://localhost:${PORT}/`);
}
