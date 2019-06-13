const accumulateProperty = (object, accumulator, objectProperty, pluralProperty) => {
    const accumulatorProperty = pluralProperty ? pluralProperty : `${objectProperty}s`

    if (!accumulator) { // accumulator is empty
        return [object[objectProperty]];
    }

    return [...accumulator[accumulatorProperty], object[objectProperty]];
};

const mergeMetrics = (snap, accumulator) => {
    if (!accumulator) { // accumulator is empty
        return snap.metrics.map(metric => ({
            name: metric.name,
            durations: [metric.duration],
            stdDeviations: [metric.stdDeviation]
        }));
    }

    return accumulator.metrics.map(previousMetric => {
        const metric = snap.metrics.find(m => m.name === previousMetric.name);

        if (!metric) { return previousMetric; }

        return {
            name: previousMetric.name,
            durations: [...previousMetric.durations, metric.duration],
            stdDeviations: [...previousMetric.stdDeviations, metric.stdDeviation]
        }
    })
}

export const snapshotsToBenchmarks = (snapshots) => {
    const benchesByKeys = snapshots.reduce((acc, snap) => ({
        ...acc,
        [snap.name]: {
            ...acc[snap.name],
            commits: [...accumulateProperty(snap, acc[snap.name], 'commit')],
            commitDates: [...accumulateProperty(snap, acc[snap.name], 'commitDate')],
            environmentHashes: [...accumulateProperty(snap, acc[snap.name], 'environmentHash', 'environmentHashes')],
            similarityHashes: [...accumulateProperty(snap, acc[snap.name], 'similarityHash', 'similarityHashes')],
            metrics: mergeMetrics(snap, acc[snap.name])
        }
    }), {})

    const benchmarks = Object.keys(benchesByKeys).map(key => ({
        name: key,
        ...benchesByKeys[key]
    }))

    return benchmarks
};