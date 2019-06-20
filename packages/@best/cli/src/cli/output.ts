import Table from 'cli-table';
import chalk from 'chalk';
import Histogram from './histogram';
import { computeSampleStats } from '@best/analyzer';
import {
    BenchmarkMetricNames,
    BenchmarkResultsSnapshot,
    EnvironmentConfig, GlobalConfig, StatsNode,
    StatsResults
} from "@best/types";

/*
 * The Output module can write a report or a comparison to a given stream based on a configuration.
 */
export default class Output {
    config: any;
    stream: any;
    constructor(config: GlobalConfig, stream: any) {
        this.config = config || {};
        this.stream = stream;
    }

    /*
     * Show a report for a given set of results.
     */
    report(results: BenchmarkResultsSnapshot[]) {
        results.forEach((result: BenchmarkResultsSnapshot) => {
            const { benchmarkInfo: { benchmarkName, benchmarkFolder }, stats } = result;
            // Optionally calculate totals for each metric.
            if (this.config.outputTotals) {
                this.generateTotal(stats);
            }
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
     * Add a new entry under `stats.benchmarks`, containing totals across all of the other entries.
     */
    generateTotal(stats: any) {
        const total: any = {};
        const metricPattern = new RegExp(`^(.*)$`); // this.config.outputMetricPattern

        function add(node: any) {
            const children = node.benchmarks;
            if (children) {
                children.forEach((child: any) => { add(child); });
            } else {
                Object.keys(node).forEach((metric: any) => {
                    if (metricPattern.test(metric) && metric !== 'name') {
                        const samples = total[metric] = total[metric] || [];
                        node[metric].samples.forEach((v: any, i: any) => {
                            samples[i] = (samples[i] || 0) + v;
                        });
                    }
                });
            }
        }

        add(stats);
        Object.keys(total).forEach(metric => {
            total[metric] = computeSampleStats(total[metric], this.config);
        });
        total.name = 'total';
        stats.benchmarks.push(total);
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
        const cpuLoad = container.load.cpuLoad; //.cpu.cpuLoad;
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
                    // if (!metricPattern.test(metric)) {
                    //     return;
                    // }

                    const metricValues = benchmarkNode.metrics[metric as BenchmarkMetricNames].stats;
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
    compare(stats: any) {
        const { baseCommit, targetCommit } = stats;
        const tables = stats.comparison.map((child: any) => {
            return this.generateComparisonTable(baseCommit, targetCommit, child);
        });

        const projectNames = Array.from(tables.reduce((list: any, tableObj: any) => {
            list.add(tableObj._projectName);
            return list;
        }, new Set()));

        const groupTables: any = projectNames.reduce((group: any, projectName: any) => {
            const filterTables = tables.filter((t: any) => t._projectName === projectName).map((t: any) => t.toString() + '\n');
            const colorProjectName = chalk.bold.dim(projectName);
            group.push(`\nProject: ${colorProjectName} \n`);
            group.push(...filterTables);
            return group;
        }, []);

        this.stream.write(groupTables.join(''));
    }

    /*
     * Get a comparison table for two different commits.
     */
    generateComparisonTable(baseCommit: string, targetCommit: string, stats: any) {
        const benchmark = stats.benchmarkName.replace('.benchmark', '');
        const table: any = new Table({
            head: [`Benchmark: ${benchmark}`, 'metric', `base(${baseCommit})`, `target(${targetCommit})`, 'Trend'],
            style: {head: ['bgBlue', 'white']},
        });

        table._projectName = stats.projectName;
        this.generateComparisonRows(table, stats);
        return table;
    }

    /*
     * Recursively populate rows into a table for a tree of comparisons.
     */
    generateComparisonRows(table: any, stats: any, name = '') {
        return stats.comparison.map((node: any) => {
            if (node.comparison) {
                const nodeName = `${node.benchmarkName || node.name}:`;
                return this.generateComparisonRows(table, node, nodeName).reduce((a: any, b: any) => a.concat(b), []);
            }

            const durationMetric = node.metrics.duration;
            const { baseStats, targetStats, samplesComparison } = durationMetric;

            table.push([
                name + node.name,
                'duration',
                `${baseStats.median.toFixed(2)} (± ${baseStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
                `${targetStats.median.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
                samplesComparison === 0 ? 'SAME' : samplesComparison === 1 ? 'SLOWER' : 'FASTER',
            ]);

            return [];
        });
    }
}

function padding(n: any) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}
