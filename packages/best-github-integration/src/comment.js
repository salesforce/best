import json2md from 'json2md';

function generateDetailsMarkdown({ targetCommit, baseCommit, tables }) {
    const projectNames = Array.from(tables.reduce((list, tableObj) => {
        list.add(tableObj.table.projectName);
        return list;
    }, new Set()));

    const groupTables = projectNames.reduce((group, projectName) => {
        const filterTables = tables.filter(t => t.table.projectName === projectName);
        group.push({ 'h2': `*${projectName}*` });
        group.push(...filterTables);
        return group;
    }, []);

    return json2md([
        {
            p: `Base commit: \`${baseCommit}\` | Target commit: \`${targetCommit}\``,
        },
        ...groupTables
    ]);
}

function template({ targetCommit, baseCommit, tables }) {
    const summary = json2md([{ h1: 'Benchmark results ' }]);
    const details = generateDetailsMarkdown({ targetCommit, baseCommit, tables });

    return `${summary}\n<details><summary>Click for full results</summary>\n&nbsp;\n${details}</details>`;
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

            const percentage = Math.abs((baseMed - targetMed) / baseMed * 100);
            const relativeTrend = targetMed - baseMed;
            const sign = Math.sign(relativeTrend) === 1 ? '+' : '';

            allRows.push([
                name + node.name,
                'duration',
                `${baseMed.toFixed(2)} (±${baseStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                `${targetMed.toFixed(2)} (±${targetStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                sign + relativeTrend.toFixed(1) + 'ms (' + percentage.toFixed(1) + '%) ' + (samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍'),
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
            headers: [`${mdName}`, 'metric', `base(\`${baseCommit}\`)`, `target(\`${targetCommit}\`)`, 'trend'],
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
