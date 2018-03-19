import Table from 'cli-table';
import chalk from 'chalk';

function padding(n) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}

function generateRow(benchmarks, table, level = 0) {
    benchmarks.forEach(benchmarkNode => {
        const name = benchmarkNode.name;
        // Root benchmark
        if (!benchmarkNode.benchmarks) {
            Object.keys(benchmarkNode).forEach(metric => {
                const metricValues = benchmarkNode[metric];
                if (metricValues && metricValues.sampleSize) {
                    const { sampleSize, mean, median, variance, medianAbsoluteDeviation } = metricValues;
                    table.push([
                        padding(level) + name,
                        chalk.bold(metric),
                        sampleSize,
                        mean.toFixed(4),
                        median.toFixed(4),
                        variance.toFixed(4),
                        medianAbsoluteDeviation.toFixed(4),
                    ]);
                }
            });
            // Group
        } else {
            const emptyFields = Array.apply(null, Array(6)).map(() => '-');
            table.push([padding(level) + name, ...emptyFields]);
            generateRow(benchmarkNode.benchmarks, table, level + 1);
        }
    });
}

function generateStats(benchmarkName, outputFolder, stats, stream) {
    const table = new Table({
        head: ['Benchmark name', 'Metric', 'N', 'Mean', 'Median', 'Variance', 'MedianAbsDeviation'],
        colWidths: [32, 14, 6, 12, 12, 12, 12],
    });

    generateRow(stats, table);

    stream.write(
        [
            chalk.bold.dim('\n Benchmark results for ') + chalk.bold.magentaBright(benchmarkName),
            chalk.italic(' ' + outputFolder + '/'),
            table.toString() + '\n',
        ].join('\n'),
    );
}

function generateEnviroment({ browser, runtime }, stream) {
    const cpuLoad = runtime.load.cpuLoad;
    const loadColor = cpuLoad < 10 ? 'green' : cpuLoad < 50 ? 'yellow' : 'red';

    stream.write(' ');
    stream.write(
        [
            'Browser version:    ' + chalk.bold(browser.version),
            `Benchmark CPU load: ${chalk.bold[loadColor](cpuLoad.toFixed(3) + '%')}`,
        ].join('\n '),
    );

    stream.write('\n\n');
}

export function generateReportTables(results, stream) {
    results.forEach(result => {
        const { benchmarkName, benchmarkOutputResult, stats } = result;
        generateStats(benchmarkName, benchmarkOutputResult, stats.benchmarks, stream);
        generateEnviroment(stats.environment, stream);
    });
}

function generateComparisonRows(table, stats, name = '') {
    return stats.comparison.map(node => {
        if (node.comparison) {
            const nodeName = `${node.benchmarkName || node.name}:`;
            return generateComparisonRows(table, node, nodeName).reduce((a, b) => a.concat(b), []);
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

function generateTables(baseCommit, targetCommit, stats) {
    return stats.comparison.map(comparison => generateTable(baseCommit, targetCommit, comparison));
}

function generateTable(baseCommit, targetCommit, stats) {
    const table = new Table({
        head: ['Benchmark name', 'metric', `base(${baseCommit})`, `target(${targetCommit})`, 'Trend'],
        colWidths: [50, 20, 20, 10],
    });

    table._projectName = stats.projectName;
    generateComparisonRows(table, stats);
    return table;
}

export function generateComparisonTables(comparisonStats, stream) {
    const { baseCommit, targetCommit } = comparisonStats;
    const tables = generateTables(baseCommit, targetCommit, comparisonStats);

    const projectNames = Array.from(tables.reduce((list, tableObj) => {
        list.add(tableObj._projectName);
        return list;
    }, new Set()));

    const groupTables = projectNames.reduce((group, projectName) => {
        const filterTables = tables.filter(t => t._projectName === projectName).map(t => t.toString() + '\n');
        group.push(projectName + '\n');
        group.push(...filterTables);
        return group;
    }, []);

    stream.write(groupTables.join(''));
}
