export default class Histogram {
    buckets: any;
    normalize: any;
    skewness: number;
    kurtosis: number;
    constructor(samples: any, config: any);
    toString(): string | undefined;
}
