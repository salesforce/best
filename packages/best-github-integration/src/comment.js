import json2md from 'json2md';

function template({ targetCommit, baseCommit, tables }) {
    return json2md([
        { h2: 'Benchmark comparison ' },
        {
            p: `Base commit: \`${baseCommit}\` | Target commit: \`${targetCommit}\``,
        },
        ...tables
    ]);
}

function generateRows(stats, name = '', rows = []) {
    return stats.comparison.reduce((allRows, node) => {
        if (node.comparison) {
            generateRows(node, `${node.benchmarkName || node.name}:`, rows);
        } else {
            const durationMetric = node.metrics.duration;
            const { baseStats, targetStats, samplesComparison } = durationMetric;
            const baseMed = baseStats.median;
            const targetMed = targetStats.median;

            const percentage = (baseMed - targetMed) / baseMed * 100;

            allRows.push([
                name + node.name,
                `${baseMed.toFixed(2)} (± ${baseStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                `${targetMed.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                percentage.toFixed(2) + '% ' + (samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍'),
            ]);
        }
        return allRows;
    }, rows);
}

function generateTable(baseCommit, targetCommit, stats) {
    const { benchmarkName, projectName } = stats;
    const mdName = benchmarkName.replace('.benchmark', '');
    return {
        table: {
            headers: [`${mdName}`, `base(\`${baseCommit}\`)`, `target(\`${targetCommit}\`)`, 'trend'],
            rows: generateRows(stats),
            projectName
        },
    };
}

function generateTables(baseCommit, targetCommit, stats) {
    return stats.comparison.map(comparison => generateTable(baseCommit, targetCommit, comparison));
}

export function generateComparisonComment(baseCommit, targetCommit, stats) {
    const tables = generateTables(baseCommit, targetCommit, stats);

    return template({
        baseCommit,
        targetCommit,
        tables,
    });
}
