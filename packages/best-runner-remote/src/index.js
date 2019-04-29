import path from 'path';
import fs from 'fs';
import { createTarBundle } from './create-tar';
import { preRunMessager } from '@best/messager';
import { post } from 'request';

export class Runner {
    run(benchmarkEntryBundle, projectConfig, globalConfig, messager) {
        const { projectName, benchmarkRunnerConfig } = projectConfig;
        return new Promise(async (resolve, reject) => {
            const { benchmarkName, benchmarkEntry, benchmarkSignature } = benchmarkEntryBundle;
            const { host, remoteRunner } = benchmarkRunnerConfig;
            const dir = path.dirname(benchmarkEntry);
            const file = path.resolve(dir, `${benchmarkName}.tgz`);
            const config = {
                benchmarkName,
                benchmarkSignature,
                projectConfig: { ...projectConfig, benchmarkRunner: remoteRunner },
                globalConfig
            };

            await createTarBundle(dir, benchmarkName);

            if (!fs.existsSync(file)) {
                return reject(new Error(`Benchmark artifact not found (${file})`));
            }

            preRunMessager.print(`Connecting to ${host}\n`, process.stdout);

            const req = post(`${host}/job/${encodeURIComponent(JSON.stringify(config))}`)
                .on('error', reject)
                .on('response', res => {
                    preRunMessager.clear(process.stdout);

                    let buffer = '';
                    res.on('data', chunk => {
                        buffer += chunk;
                        const lines = buffer.split('\n');
                        buffer = lines.pop();
                        for (const line of lines) {
                            const [event, json] = line.split('\t');
                            try {
                                const data = JSON.parse(json);
                                res.emit(event, data);
                            } catch (e) {
                                res.emit('error', e.stack);
                            }
                        }
                    });

                    res.on('error', reject);

                    res.on('job:queued', ({ pending }) => {
                        messager.logState(`Queued behind ${pending} pending tasks.`);
                    });

                    res.on('benchmark:start', () => {
                        messager.logState(`Running benchmarks remotely...`);
                        messager.onBenchmarkStart(benchmarkName, projectName, {
                            displayPath: `${host}/${benchmarkName}`,
                        });
                    });

                    res.on('benchmark:update', ({ state, opts }) => {
                        messager.updateBenchmarkProgress(state, opts);
                    });

                    res.on('benchmark:end', () => {
                        messager.onBenchmarkEnd(benchmarkName, projectName);
                    });

                    res.on('benchmark:results', ({ results, environment }) => {
                        resolve({ results, environment });
                    });
                });
            fs.createReadStream(file).pipe(req);
        });
    }
}
