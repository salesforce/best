import express from 'express';
import { spawn } from 'child_process';

export async function runBenchmarks(benchmarksBuilds, globalConfig, messager) {
    const results = [];
    for (const benchmarkBuild of benchmarksBuilds) {
        benchmarkBuild.globalConfig = globalConfig;
        const benchmarkResults = await runBenchmark(benchmarkBuild, messager);
        results.push(benchmarkResults);
    }

    return results;
}

export async function runBenchmark(
    { benchmarkName, benchmarkEntry, benchmarkSignature, projectConfig, globalConfig },
    messager,
) {
    const { benchmarkRunner } = projectConfig;
    const runner = require(benchmarkRunner);

    // Serve static files over HTTP.
    const app = await createExpressApp();
    const { cacheDirectory, staticFiles } = projectConfig;
    app.static(cacheDirectory);
    Object.keys(staticFiles).forEach(href => {
        const path = staticFiles[href];
        app.static(href, path);
    });

    const benchmarkUrl = `${app.url}${benchmarkEntry}`;
    const results = await runner.run({ benchmarkName, benchmarkUrl }, projectConfig, globalConfig, messager);

    // Allow OSX users to optionally open benchmark URLs in their default browser for debugging.
    if (globalConfig.openBenchmarks) {
        spawn('open', [benchmarkUrl]);
    } else {
        app.stop();
    }

    results.benchmarkSignature = benchmarkSignature;
    results.benchmarkName = benchmarkName;
    results.benchmarkEntry = benchmarkEntry;
    results.projectConfig = projectConfig;

    return results;
}

// Create a new express app on a random port.
export async function createExpressApp() {
    return new Promise(resolve => {
        const app = express();
        const server = app.listen(() => {
            app.url = `http://localhost:${server.address().port}`;
            resolve(app);
        });

        // Allow static assets to be served from specified paths.
        app.static = (href, path) => {
            app.use(href, express.static(path || href));
        };

        // Keep track of open sockets.
        const sockets = {};
        let socketId = 0;
        server.on('connection', socket => {
            const id = `s${++socketId}`;
            sockets[id] = socket;
            socket.on('close', () => delete sockets[id]);
        });

        // Stop the server by ending open sockets.
        app.stop = () => {
            server.close();
            Object.values(sockets).forEach(socket => {
                socket.end();
                socket.unref();
            });
        };
    });
}
