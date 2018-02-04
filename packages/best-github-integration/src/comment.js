import json2md from 'json2md';

function template({ targetCommit, baseCommit, table }) {
    return json2md([
        { h2: 'Benchmark comparison ' },
        {
            p: `Base commit: \`${baseCommit}\` | Target commit: \`${targetCommit}\``,
        },
        table,
    ]);
}

function generateRows(stats, name = '', rows = []) {
    return stats.comparison.reduce((allRows, node) => {
        if (node.comparison) {
            generateRows(node, `${node.benchmarkName || node.name}:`, rows);
        } else {
            const durationMetric = node.metrics.duration;
            const { baseStats, targetStats, samplesComparison } = durationMetric;

            allRows.push([
                name + node.name,
                `${baseStats.median.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                `${targetStats.median.toFixed(2)} (± ${targetStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍',
            ]);
        }
        return allRows;
    }, rows);
}

function generateTable(baseCommit, targetCommit, stats) {
    return {
        table: {
            headers: ['benchmark', `base(\`${baseCommit}\`)`, `target(\`${targetCommit}\`)`, 'trend'],
            rows: generateRows(stats),
        },
    };
}

export function generateComparisonComment(baseCommit, targetCommit, stats) {
    const table = generateTable(baseCommit, targetCommit, stats);

    return template({
        baseCommit,
        targetCommit,
        table,
    });
}
