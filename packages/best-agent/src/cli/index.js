import express from 'express';
import { readFileSync } from 'fs';
import Job from '../job';

const { env } = process;
const PORT = env.PORT || 5000;
const SSL_PFX_FILE = env.SSL_PFX_FILE;
const SSL_PFX_PASSPHRASE = env.SSL_PFX_PASSPHRASE;

// Allow developers to simulate a load-balanced cluster locally.
let CONCURRENCY = parseInt(env.CONCURRENCY, 10) || 1;
if (CONCURRENCY > 1) {
    if (/^d/i.test(env.NODE_ENV)) {
        console.warn(`WARNING: Concurrency affects browser performance.`);
    } else {
        console.error(`ERROR: Concurrency is only allowed in dev environments.`);
        CONCURRENCY = 1;
    }
}

// Run a best-agent server.
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

    // Let each Job control its timeout logic.
    server.setTimeout(0);

    const queue = [];
    let runningCount = 0;

    app.get('/', (req, res) => res.send('BEST agent'));

    app.post('/job/:config', (req, res) => {
        const job = new Job(req, res);
        console.log(`Receiving job ${job.id}`);
        job.on('job:uploaded', () => {
            console.log(`Received job ${job.id}`);
            queue.push(job);
            if (runNextJob() !== job) {
                job.send('job:queued', { pending: queue.length - 1 });
            }
        });
        job.on('job:finished', () => {
            console.log(`Finished job ${job.id}`);
            runningCount--;
            runNextJob();
        });
    });

    function runNextJob() {
        const job = (runningCount < CONCURRENCY) ? queue.shift() : null;
        if (job) {
            console.log(`Running job ${job.id}...`);
            job.run();
            runningCount++;
        }
        return job;
    }

    console.log(`Listening at ${protocol}://localhost:${PORT}/`);
}
