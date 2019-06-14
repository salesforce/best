import json2md from 'json2md';

function generateDetailsMarkdown({ targetCommit, baseCommit, tables }: any) {
    const projectNames = Array.from(tables.reduce((list: any, tableObj: any) => {
        list.add(tableObj.table.projectName);
        return list;
    }, new Set()));

    const groupTables: any = projectNames.reduce((group: any, projectName) => {
        const filterTables = tables.filter((t: any) => t.table.projectName === projectName);
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

function template({ targetCommit, baseCommit, tables }: any) {
    const details = generateDetailsMarkdown({ targetCommit, baseCommit, tables });

    return details;
}

function generateRows(stats: any, name = '', rows = []) {
    return stats.comparison.reduce((allRows: any, node: any) => {
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
                `${baseMed.toFixed(2)} (±${baseStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                `${targetMed.toFixed(2)} (±${targetStats.medianAbsoluteDeviation.toFixed(2)} ms)`,
                sign + relativeTrend.toFixed(1) + 'ms (' + percentage.toFixed(1) + '%) ' + (samplesComparison === 0 ? '👌' : samplesComparison === 1 ? '👎' : '👍'),
            ]);
        }
        return allRows;
    }, rows);
}

function generateTable(baseCommit: string, targetCommit: string, stats: any) {
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

function generateTables(baseCommit: string, targetCommit: string, stats: any) {
    return stats.comparison.map((comparison: any) => generateTable(baseCommit, targetCommit, comparison));
}

export function generateComparisonComment(baseCommit: string, targetCommit: string, stats: any) {
    const tables = generateTables(baseCommit, targetCommit, stats);

    return template({
        baseCommit,
        targetCommit,
        tables,
    });
}
