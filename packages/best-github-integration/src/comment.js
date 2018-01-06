function template({ targetCommit, baseCommit }) {
    return `## Benchmark comparison
Base commit: \`${targetCommit}\` | Target commit: \`${baseCommit}\`

WIP`;
}

export function generateComparisonComment(baseCommit, targetCommit, stats) {
    return template({ baseCommit, targetCommit });
}
