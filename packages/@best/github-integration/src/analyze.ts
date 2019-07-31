import json2md from 'json2md';
import { BenchmarkComparison, ResultComparison, BenchmarkMetricNames, BenchmarkStats } from '@best/types';

interface MarkdownTable {
    table: {
        headers: string[];
        rows: string[][];
    }
}

interface SignificantlyChangedSummary {
    improved: string[][]
    regressed: string[][]
}

type GroupedTables = { [projectName: string]: MarkdownTable[] }

function padding(n: number) {
    return n > 0
        ? Array.apply(null, Array((n - 1) * 3))
            .map(() => ' ')
            .join('') + '└─ '
        : '';
}

function generateRow(
    name: string,
    metrics: {
        baseStats: BenchmarkStats;
        targetStats: BenchmarkStats;
        samplesComparison: 0 | 1 | -1;
    },
    includeEmojiTrend: boolean
): string[] {
    const baseStats = metrics.baseStats;
    const targetStats = metrics.targetStats;
    const samplesComparison = metrics.samplesComparison;

    const percentage = (Math.abs(baseStats.median - targetStats.median) / baseStats.median) * 100;
    const relativeTrend = targetStats.median - baseStats.median;
    const sign = Math.sign(relativeTrend) === 1 ? '+' : '';

    const comparisonEmoji = (samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍');

    return [
        name,
        `${baseStats.median.toFixed(2)} (± ${baseStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
        `${targetStats.median.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)}ms)`,
        sign + relativeTrend.toFixed(1) + 'ms (' + percentage.toFixed(1) + '%)' + (includeEmojiTrend ? ` ${comparisonEmoji}` : '')
    ]
}

function generateDetailsMarkdown(tables: GroupedTables) {
    const flattenedTables = Object.keys(tables).reduce((groups, projectName): json2md.DataObject[] => {
        groups.push({ h2: `*${projectName}*` });
        groups.push(...tables[projectName]);
        return groups;
    }, <json2md.DataObject[]>[])

    return json2md(flattenedTables);
}

function significantlyChangedRows(stats: ResultComparison, threshold: number, name: string = '', initialRows: SignificantlyChangedSummary = { improved: [], regressed: [] }) {
    const highThreshold = Math.abs(threshold); // handle whether the threshold is positive or negative
    const lowThreshold = -1 * highThreshold;

    if (stats.type === "project" || stats.type === "group") {
        return stats.comparisons.reduce((rows, node): SignificantlyChangedSummary => {
            if (node.type === "project" || node.type === "group") {
                return significantlyChangedRows(node, threshold, node.name, rows);
            } else if (node.type === "benchmark") {
                // for the significantly changed summary, we only check for aggregate
                const metrics = node.metrics.aggregate;

                if (metrics) {
                    const { baseStats, targetStats, samplesComparison } = metrics;
                    
                    if (samplesComparison !== 0 && baseStats.median > 1 && targetStats.median > 1) { // ensures passes Mann-Whiteney U test and results are more than 1ms
                        const percentage = (Math.abs(baseStats.median - targetStats.median) / baseStats.median) * 100;
                        const relativeTrend = targetStats.median - baseStats.median;
                        const relativePercentage = Math.sign(relativeTrend) * percentage;
                        const row = generateRow(`${name}/${node.name}`, metrics, false);

                        if (relativePercentage < lowThreshold) { // less than a negative is GOOD (things got faster)
                            rows.improved.push(row);
                        } else if (relativePercentage > highThreshold) { // more than a positive is WORSE (things got slower)
                            rows.regressed.push(row);
                        }
                    }
                }
            }

            return rows;
        }, initialRows)
    } else {
        return initialRows;
    }
}

function generateRows(stats: ResultComparison, name: string = '', initialRows: string[][] = []) {
    if (stats.type === "project" || stats.type === "group") {
        return stats.comparisons.reduce((rows, node): string[][] => {
            if (node.type === "project" || node.type === "group") {
                return generateRows(node, node.name, rows);
            } else if (node.type === "benchmark") {
                // row with benchmark name
                const emptyFields = Array.apply(null, Array(3)).map(() => '-');
                rows.push([`${name}/${node.name}`, ...emptyFields]);

                Object.keys(node.metrics).forEach(metric => {
                    const metrics = node.metrics[metric as BenchmarkMetricNames];

                    if (metrics) {
                        rows.push(generateRow(padding(1) + metric, metrics, true));
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

    const tablesMarkdown = generateDetailsMarkdown(tables);

    return `# Full Results\n\n${tablesMarkdown}`;
}

export function generateComparisonSummary(result: BenchmarkComparison, threshold: number) {
    const { baseCommit, targetCommit, comparisons } = result;

    const tables: GroupedTables = comparisons.reduce((tables, node): GroupedTables => {
        const { name: benchmarkName } = node;
        const mdName = benchmarkName.replace('.benchmark', '');
        const changes = significantlyChangedRows(node, threshold);

        const rows = [];
        
        if (changes.improved.length) {
            rows.push({
                table: {
                    headers: [`✅ Improvements`, `base (\`${baseCommit}\`)`, `target (\`${targetCommit}\`)`, 'trend'],
                    rows: changes.improved
                }
            })
        }

        if (changes.regressed.length) {
            rows.push({
                table: {
                    headers: [`❌ Regressions`, `base (\`${baseCommit}\`)`, `target (\`${targetCommit}\`)`, 'trend'],
                    rows: changes.regressed
                }
            });
        }

        if (rows.length) {
            tables[`${mdName}`] = rows;
        }

        return tables;
    }, <GroupedTables>{})

    return generateDetailsMarkdown(tables);
}

// this takes all the results and recursively goes through them
// then it creates a flat list of all of the percentages of change
export function generatePercentages(stats: ResultComparison, rows: number[] = []): number[] {
    if (stats.type === "project" || stats.type === "group") {
        return stats.comparisons.reduce((allRows, node: ResultComparison) => {
            if (node.type === "project" || node.type === "group") {
                generatePercentages(node, rows);
            } else if (node.type === "benchmark") {
                Object.keys(node.metrics).forEach(metricName => {
                    const metrics = node.metrics[metricName as BenchmarkMetricNames];

                    if (metrics) {
                        const { baseStats, targetStats, samplesComparison } = metrics;
                        const baseMed = baseStats.median;
                        const targetMed = targetStats.median;
            
                        const percentage = Math.abs((baseMed - targetMed) / baseMed * 100);
                        const relativeTrend = targetMed - baseMed;

                        // ensures passes Mann-Whiteney U test and results are more than 1ms
                        if (samplesComparison !== 0 && baseMed > 1 && targetMed > 1) {
                            allRows.push(Math.sign(relativeTrend) * percentage);
                        } else {
                            allRows.push(0); // otherwise we count it as zero
                        }
                    }
                })
            }
            return allRows;
        }, rows);
    }

    return rows;
}