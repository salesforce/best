export default {
    baseCommit: 'abcdef0',
    targetCommit: '1234567',
    stats: {
        comparison: [
            {
                benchmarkName: 'foo.benchmark.js',
                projectName: 'Project Foo',
                comparison: [
                    {
                        name: 'Foo Test 1',
                        metrics: {
                            duration: {
                                baseStats: {
                                    median: 3000,
                                    medianAbsoluteDeviation: 1.9999
                                },
                                targetStats: {
                                    median: 4000,
                                    medianAbsoluteDeviation: 2.9999
                                },
                                samplesComparison: 20
                            }
                        }
                    },
                    {
                        name: 'Foo Test 2',
                        metrics: {
                            duration: {
                                baseStats: {
                                    median: 7000,
                                    medianAbsoluteDeviation: -3.25
                                },
                                targetStats: {
                                    median: 5000,
                                    medianAbsoluteDeviation: 7.3
                                },
                                samplesComparison: 20
                            }
                        }
                    }
                ]
            },
            {
                benchmarkName: 'bar.benchmark.js',
                projectName: 'Project Bar',
                comparison: [
                    {
                        name: 'Bar Test 1',
                        metrics: {
                            duration: {
                                baseStats: {
                                    median: 1000,
                                    medianAbsoluteDeviation: -1
                                },
                                targetStats: {
                                    median: 2000,
                                    medianAbsoluteDeviation: -2.7777
                                },
                                samplesComparison: 20
                            }
                        }
                    }
                ]
            }
        ]
    }
};
