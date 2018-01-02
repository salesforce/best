import Table from "cli-table";
import chalk from "chalk";

function generateStats(benchmarkName, stats, stream ) {
    const table = new Table({
        head: ['Benchmark name', 'Metric', 'N', 'Mean', 'Median', 'Variance', 'MedianAbsDeviation'],
        colWidths: [32, 14, 6, 12, 12, 12, 12]
    });

    let level = 0;
    const benchLevel = Object.keys(stats).reduce((r, k) => (r[k] = level++, r), {});
    const padding = (n) => (n > 0 ? Array.apply(null, Array((n - 1) * 3)).map(() => ' ').join('') + '└─ ' : '');
    Object.keys(stats).forEach((benchName) => {
        Object.keys(stats[benchName]).forEach((metric) => {
            const metricValues = stats[benchName][metric];
            if (metricValues && metricValues.sampleSize) {
                const { sampleSize, mean, median, variance, medianAbsoluteDeviation } = metricValues;
                table.push([
                    padding(benchLevel[benchName]) + benchName,
                    metric,
                    sampleSize,
                    mean.toFixed(4),
                    median.toFixed(4),
                    variance.toFixed(4),
                    medianAbsoluteDeviation.toFixed(4)
                ]);
            }
        });
    });

    stream.write(chalk.bold.dim('\n Benchmark results for ') + chalk.bold.magentaBright(benchmarkName) + '\n');
    stream.write(table.toString() + '\n');
}

function generateEnviroment({ hardware, browser }, stream) {
    const currentLoad = hardware.load.currentload;
    const loadColor = currentLoad < 10 ? 'green' : currentLoad < 50 ? 'yellow' : 'red' ;

    stream.write(' ');
    stream.write([
        'Browser version:  ' + chalk.bold.black(browser.version),
        `Current CPU load: ${chalk[loadColor](currentLoad.toFixed(3) + '%')}`
    ].join('\n '));

    stream.write('\n\n');
}

export function generateTables(results, stream) {
    results.forEach((result) => {
        const { benchmarkName, environment, proyectConfig } = result;
        generateStats(benchmarkName, result.stats, stream);
        generateEnviroment(environment, stream);
    });
}
