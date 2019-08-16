/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import Table from 'cli-table';
import chalk from 'chalk';
import Histogram from './histogram';

import {
    BenchmarkMetricNames,
    BenchmarkResultsSnapshot,
    EnvironmentConfig, StatsNode,
    BenchmarkComparison, ResultComparison,
    StatsResults
} from "@best/types";
import { OutputStream } from '@best/console-stream';

interface OutputConfig {
    outputHistograms?: boolean;
}

/*
 * The Output module can write a report or a comparison to a given stream based on a configuration.
 */
export default class Output {
    config: OutputConfig;
    stream: OutputStream;
    constructor(config: OutputConfig, stream: OutputStream) {
        this.config = config || {};
        this.stream = stream;
    }

    /*
     * Show a report for a given set of results.
     */
    report(results: BenchmarkResultsSnapshot[]) {
        results.forEach((result: BenchmarkResultsSnapshot) => {
            const { benchmarkInfo: { benchmarkName }, stats, projectConfig: { benchmarkOutput: benchmarkFolder } } = result;

            // Stats table.
            this.writeStats(benchmarkName, benchmarkFolder, stats!);

            // OS & Browser.
            this.writeEnvironment(result.environment);

            // Optional histogram for each line in the stats table.
            if (this.config.outputHistograms) {
                this.writeHistograms(stats!);
            }
        });
    }

    /*
     * Write a table of statistics for a single benchmark file.
     */
    writeStats(benchmarkName: string, resultsFolder: string, stats: StatsResults) {
        const table = new Table({
            head: ['Benchmark name', 'Metric (ms)', 'N', 'Mean ± StdDev', 'Median ± MAD'],
            style: { head: ['bgBlue', 'white'] },
        });

        this.generateRows(table, stats.results);

        this.stream.write(
            [
                chalk.bold.dim('\n Benchmark results for ') + chalk.bold.magentaBright(benchmarkName),
                chalk.italic(' ' + resultsFolder + '/'),
                table.toString() + '\n',
            ].join('\n'),
        );
    }

    /*
     * Write browser and CPU load information.
     */
    writeEnvironment({ browser, container }: EnvironmentConfig) {
        const cpuLoad = container.load.cpuLoad;
        const loadColor = cpuLoad < 10 ? 'green' : cpuLoad < 50 ? 'yellow' : 'red';

        this.stream.write(' ');
        this.stream.write(
            [
                'Browser version:    ' + chalk.bold(browser.version),
                `Benchmark CPU load: ${chalk.bold[loadColor](cpuLoad.toFixed(3) + '%')}`,
            ].join('\n '),
        );

        this.stream.write('\n\n');
    }

    /*
     * Write a set of histograms for a tree of benchmarks.
     */
    writeHistograms(benchmarks: any, parentPath: string = '') {
        // const metricPattern = this.config.outputMetricPattern;
        // const histogramPattern = this.config.outputHistogramPattern;
        benchmarks.forEach((benchmark: any) => {
            const path = `${parentPath}${benchmark.name}`;
            const children = benchmark.benchmarks;
            if (children) {
                this.writeHistograms(children, `${path} > `);
            } else {
                // if (!histogramPattern.test(path)) {
                //     return;
                // }
                Object.keys(benchmark).forEach(metric => {
                    // if (!metricPattern.test(metric)) {
                    //     return;
                    // }
                    const stats = benchmark[metric];
                    if (stats && stats.sampleSize) {
                        const { samples } = stats;
                        const histogram = new Histogram(samples, this.config);
                        const plot = histogram.toString();
                        this.stream.write(`\n${path} > ${metric}\n${plot}\n\n`);
                    }
                });
            }
        });
    }

    /*
     * Recursively populate rows of statistics into a table for a tree of benchmarks.
     */
    generateRows(table: any, benchmarks: StatsNode[], level = 0) {
        // const metricPattern = //this.config.outputMetricPattern;
        benchmarks.forEach((benchmarkNode: StatsNode) => {
            const name = benchmarkNode.name;
            // Root benchmark
            if (benchmarkNode.type === "benchmark") {
                Object.keys(benchmarkNode.metrics).forEach((metric: string) => {
                    const metricsStats = benchmarkNode.metrics[metric as BenchmarkMetricNames];
                    const metricValues = metricsStats && metricsStats.stats;
                    if (metricValues && metricValues.sampleSize) {
                        const { sampleSize, mean, median, variance, medianAbsoluteDeviation } = metricValues;
                        table.push([
                            padding(level) + name,
                            chalk.bold(metric),
                            sampleSize,
                            `${mean.toFixed(3)}` + chalk.gray(` ± ${(Math.sqrt(variance) / mean * 100).toFixed(1)}%`),
                            `${median.toFixed(3)}` + chalk.gray(` ± ${(medianAbsoluteDeviation / median * 100).toFixed(1)}%`),
                        ]);
                    }
                });
                // Group
            } else if (benchmarkNode.type === "group") {
                const emptyFields = Array.apply(null, Array(4)).map(() => '-');
                table.push([padding(level) + name, ...emptyFields]);
                this.generateRows(table, benchmarkNode.nodes, level + 1);
            }
        });
    }

    /*
     * Show a comparison for a pair of commits.
     */
    compare(result: BenchmarkComparison) {
        const { baseCommit, targetCommit } = result;

        type GroupedTables = { [projectName: string]: Table[] }

        const tables: GroupedTables = result.comparisons.reduce((tables, node): GroupedTables => {
            if (node.type === "project" || node.type === "group") {
                const group = node.comparisons.map(child => {
                    return this.generateComparisonTable(baseCommit, targetCommit, child);
                })

                return {
                    ...tables,
                    [node.name]: group
                }
            }
            return tables;
        }, <GroupedTables>{})

        const flattenedTables = Object.keys(tables).reduce((groups, projectName): string[] => {
            const stringifiedTables = tables[projectName].map(t => t.toString() + '\n');
            const colorProjectName = chalk.bold.dim(projectName);
            groups.push(`\nProject: ${colorProjectName}\n`);
            groups.push(...stringifiedTables);
            return groups;
        }, <string[]>[])

        this.stream.write(flattenedTables.join(''));
    }

    /*
     * Get a comparison table for two different commits.
     */
    generateComparisonTable(baseCommit: string, targetCommit: string, stats: ResultComparison) {
        const benchmark = stats.name.replace('.benchmark', '');
        const table = new Table({
            head: [`Benchmark: ${benchmark}`, `base (${baseCommit})`, `target (${targetCommit})`, 'trend'],
            style: {head: ['bgBlue', 'white']}
        });

        this.generateComparisonRows(table, stats);
        return table;
    }

    /*
     * Recursively populate rows into a table for a tree of comparisons.
     */
    generateComparisonRows(table: Table, stats: ResultComparison, groupName = '') {
        if (stats.type === "project" || stats.type === "group") {
            stats.comparisons.forEach(node => {
                if (node.type === "project" || node.type === "group") {
                    const name = node.name;
                    this.generateComparisonRows(table, node, name);
                } else if (node.type === "benchmark") {
                    // // row with benchmark name
                    const emptyFields = Array.apply(null, Array(3)).map(() => '-');
                    table.push([chalk.dim(groupName + '/') + chalk.bold(node.name), ...emptyFields]);

                    // row for each metric
                    Object.keys(node.metrics).forEach((metric: string) => {
                        const metrics = node.metrics[metric as BenchmarkMetricNames];

                        if (metrics) {
                            const baseStats = metrics.baseStats;
                            const targetStats = metrics.targetStats;
                            const samplesComparison = metrics.samplesComparison;

                            table.push([
                                padding(1) + metric,
                                `${baseStats.median.toFixed(2)}` + chalk.gray(` (± ${baseStats.medianAbsoluteDeviation.toFixed(2)}ms)`),
                                `${targetStats.median.toFixed(2)}` + chalk.gray(` (± ${targetStats.medianAbsoluteDeviation.toFixed(2)}ms)`),
                                chalk.bold(samplesComparison === 0 ? 'SAME' : samplesComparison === 1 ? chalk.red('SLOWER') : chalk.green('FASTER'))
                            ]);
                        }
                    });
                }
            })
        }
    }
}

function padding(n: number) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}
