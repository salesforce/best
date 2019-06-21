import json2md from 'json2md';
import { BenchmarkComparison, ResultComparison, BenchmarkMetricNames } from '@best/types';

interface MarkdownTable {
    table: {
        headers: string[];
        rows: string[][];
    }
}

type GroupedTables = { [projectName: string]: MarkdownTable[] }

function padding(n: number) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}

function generateDetailsMarkdown(baseCommit: string, targetCommit: string, tables: GroupedTables) {
    const flattenedTables = Object.keys(tables).reduce((groups, projectName): json2md.DataObject[] => {
        groups.push({ h2: `*${projectName}*` });
        groups.push(...tables[projectName]);
        return groups;
    }, <json2md.DataObject[]>[])

    return json2md([
        {
            p: `Base commit: \`${baseCommit}\` | Target commit: \`${targetCommit}\``,
        },
        ...flattenedTables
    ]);
}

function generateRows(stats: ResultComparison, name = '', initialRows: string[][] = []) {
    if (stats.type === "project" || stats.type === "group") {
        return stats.comparisons.reduce((rows, node): string[][] => {
            if (node.type === "project" || node.type === "group") {
                return generateRows(node, node.name, initialRows);
            } else if (node.type === "benchmark") {
                // // row with benchmark name
                const emptyFields = Array.apply(null, Array(3)).map(() => '-');
                rows.push([`${name}/${node.name}`, ...emptyFields]);

                Object.keys(node.metrics).forEach(metric => {
                    const metrics = node.metrics[metric as BenchmarkMetricNames];

                    if (metrics) {
                        const baseStats = metrics.baseStats;
                        const targetStats = metrics.targetStats;
                        const samplesComparison = metrics.samplesComparison;

                        const percentage = (Math.abs(baseStats.median - targetStats.median) / baseStats.median) * 100;
                        const relativeTrend = targetStats.median - baseStats.median;
                        const sign = Math.sign(relativeTrend) === 1 ? '+' : '';

                        rows.push([
                            padding(1) + metric,
                            `${baseStats.median.toFixed(2)} (± ${baseStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
                            `${targetStats.median.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
                            sign + relativeTrend.toFixed(1) + 'ms (' + percentage.toFixed(1) + '%) ' + (samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍')
                        ])
                    }
                })
            }
            return rows;
        }, initialRows);
    } else {
        return initialRows;
    }
}

function generateTable(baseCommit: string, targetCommit: string, stats: ResultComparison): MarkdownTable {
    const { name: benchmarkName } = stats;
    const mdName = benchmarkName.replace('.benchmark', '');

    return {
        table: {
            headers: [`${mdName}`, `base (\`${baseCommit}\`)`, `target (\`${targetCommit}\`)`, 'trend'],
            rows: generateRows(stats)
        }
    }
}

export function generateComparisonComment(result: BenchmarkComparison) {
    const { baseCommit, targetCommit } = result;

    const tables: GroupedTables = result.comparisons.reduce((tables, node): GroupedTables => {
        if (node.type === "project" || node.type === "group") {
            const group = node.comparisons.map(child => {
                return generateTable(baseCommit, targetCommit, child);
            })

            return {
                ...tables,
                [node.name]: group
            }
        }
        return tables;
    }, <GroupedTables>{})

    return generateDetailsMarkdown(baseCommit, targetCommit, tables);
}
