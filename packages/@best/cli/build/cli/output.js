"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_table_1 = __importDefault(require("cli-table"));
const chalk_1 = __importDefault(require("chalk"));
const histogram_1 = __importDefault(require("./histogram"));
const analyzer_1 = require("@best/analyzer");
/*
 * The Output module can write a report or a comparison to a given stream based on a configuration.
 */
class Output {
    constructor(config, stream) {
        this.config = config || {};
        this.stream = stream;
    }
    /*
     * Show a report for a given set of results.
     */
    report(results) {
        results.forEach((result) => {
            const { benchmarkName, benchmarkOutputResult, stats } = result;
            // Optionally calculate totals for each metric.
            if (this.config.outputTotals) {
                this.generateTotal(stats);
            }
            // Stats table.
            this.writeStats(benchmarkName, benchmarkOutputResult, stats.benchmarks);
            // OS & Browser.
            this.writeEnvironment(stats.environment);
            // Optional histogram for each line in the stats table.
            if (this.config.outputHistograms) {
                this.writeHistograms(stats.benchmarks);
            }
        });
    }
    /*
     * Add a new entry under `stats.benchmarks`, containing totals across all of the other entries.
     */
    generateTotal(stats) {
        const total = {};
        const metricPattern = this.config.outputMetricPattern;
        function add(node) {
            const children = node.benchmarks;
            if (children) {
                children.forEach((child) => { add(child); });
            }
            else {
                Object.keys(node).forEach((metric) => {
                    if (metricPattern.test(metric) && metric !== 'name') {
                        const samples = total[metric] = total[metric] || [];
                        node[metric].samples.forEach((v, i) => {
                            samples[i] = (samples[i] || 0) + v;
                        });
                    }
                });
            }
        }
        add(stats);
        Object.keys(total).forEach(metric => {
            total[metric] = analyzer_1.computeSampleStats(total[metric], this.config);
        });
        total.name = 'total';
        stats.benchmarks.push(total);
    }
    /*
     * Write a table of statistics for a single benchmark file.
     */
    writeStats(benchmarkName, resultsFolder, stats) {
        const table = new cli_table_1.default({
            head: ['Benchmark name', 'Metric (ms)', 'N', 'Mean ± StdDev', 'Median ± MAD'],
            style: { head: ['bgBlue', 'white'] },
        });
        this.generateRows(table, stats);
        this.stream.write([
            chalk_1.default.bold.dim('\n Benchmark results for ') + chalk_1.default.bold.magentaBright(benchmarkName),
            chalk_1.default.italic(' ' + resultsFolder + '/'),
            table.toString() + '\n',
        ].join('\n'));
    }
    /*
     * Write browser and CPU load information.
     */
    writeEnvironment({ browser, runtime }) {
        const cpuLoad = runtime.load.cpuLoad;
        const loadColor = cpuLoad < 10 ? 'green' : cpuLoad < 50 ? 'yellow' : 'red';
        this.stream.write(' ');
        this.stream.write([
            'Browser version:    ' + chalk_1.default.bold(browser.version),
            `Benchmark CPU load: ${chalk_1.default.bold[loadColor](cpuLoad.toFixed(3) + '%')}`,
        ].join('\n '));
        this.stream.write('\n\n');
    }
    /*
     * Write a set of histograms for a tree of benchmarks.
     */
    writeHistograms(benchmarks, parentPath = '') {
        const metricPattern = this.config.outputMetricPattern;
        const histogramPattern = this.config.outputHistogramPattern;
        benchmarks.forEach((benchmark) => {
            const path = `${parentPath}${benchmark.name}`;
            const children = benchmark.benchmarks;
            if (children) {
                this.writeHistograms(children, `${path} > `);
            }
            else {
                if (!histogramPattern.test(path)) {
                    return;
                }
                Object.keys(benchmark).forEach(metric => {
                    if (!metricPattern.test(metric)) {
                        return;
                    }
                    const stats = benchmark[metric];
                    if (stats && stats.sampleSize) {
                        const { samples } = stats;
                        const histogram = new histogram_1.default(samples, this.config);
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
    generateRows(table, benchmarks, level = 0) {
        const metricPattern = this.config.outputMetricPattern;
        benchmarks.forEach((benchmarkNode) => {
            const name = benchmarkNode.name;
            // Root benchmark
            if (!benchmarkNode.benchmarks) {
                Object.keys(benchmarkNode).forEach(metric => {
                    if (!metricPattern.test(metric)) {
                        return;
                    }
                    const metricValues = benchmarkNode[metric];
                    if (metricValues && metricValues.sampleSize) {
                        const { sampleSize, mean, median, variance, medianAbsoluteDeviation } = metricValues;
                        table.push([
                            padding(level) + name,
                            chalk_1.default.bold(metric),
                            sampleSize,
                            `${mean.toFixed(3)}` + chalk_1.default.gray(` ± ${(Math.sqrt(variance) / mean * 100).toFixed(1)}%`),
                            `${median.toFixed(3)}` + chalk_1.default.gray(` ± ${(medianAbsoluteDeviation / median * 100).toFixed(1)}%`),
                        ]);
                    }
                });
                // Group
            }
            else {
                const emptyFields = Array.apply(null, Array(4)).map(() => '-');
                table.push([padding(level) + name, ...emptyFields]);
                this.generateRows(table, benchmarkNode.benchmarks, level + 1);
            }
        });
    }
    /*
     * Show a comparison for a pair of commits.
     */
    compare(stats) {
        const { baseCommit, targetCommit } = stats;
        const tables = stats.comparison.map((child) => {
            return this.generateComparisonTable(baseCommit, targetCommit, child);
        });
        const projectNames = Array.from(tables.reduce((list, tableObj) => {
            list.add(tableObj._projectName);
            return list;
        }, new Set()));
        const groupTables = projectNames.reduce((group, projectName) => {
            const filterTables = tables.filter((t) => t._projectName === projectName).map((t) => t.toString() + '\n');
            const colorProjectName = chalk_1.default.bold.dim(projectName);
            group.push(`\nProject: ${colorProjectName} \n`);
            group.push(...filterTables);
            return group;
        }, []);
        this.stream.write(groupTables.join(''));
    }
    /*
     * Get a comparison table for two different commits.
     */
    generateComparisonTable(baseCommit, targetCommit, stats) {
        const benchmark = stats.benchmarkName.replace('.benchmark', '');
        const table = new cli_table_1.default({
            head: [`Benchmark: ${benchmark}`, 'metric', `base(${baseCommit})`, `target(${targetCommit})`, 'Trend'],
            style: { head: ['bgBlue', 'white'] },
        });
        table._projectName = stats.projectName;
        this.generateComparisonRows(table, stats);
        return table;
    }
    /*
     * Recursively populate rows into a table for a tree of comparisons.
     */
    generateComparisonRows(table, stats, name = '') {
        return stats.comparison.map((node) => {
            if (node.comparison) {
                const nodeName = `${node.benchmarkName || node.name}:`;
                return this.generateComparisonRows(table, node, nodeName).reduce((a, b) => a.concat(b), []);
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
exports.default = Output;
function padding(n) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}
//# sourceMappingURL=output.js.map