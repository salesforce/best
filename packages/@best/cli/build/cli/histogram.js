"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const asciichart_1 = __importDefault(require("asciichart"));
const simple_statistics_1 = require("simple-statistics");
const chalk_1 = __importDefault(require("chalk"));
const { gray, blue } = chalk_1.default;
/*
 * Ascii Histograms for CLI output.
 */
class Histogram {
    /*
     * Assign sample values to buckets.
     */
    constructor(samples, config) {
        // Optionally normalize log-normal distributions by taking an adjusted logarithm of each sample.
        if (config.normalize === 'log-normal') {
            const offset = simple_statistics_1.min(samples) - 0.1;
            samples = samples.map((x) => Math.log(x - offset));
        }
        const { histogramMaxWidth, histogramQuantileRange } = config;
        const lo = simple_statistics_1.quantile(samples, histogramQuantileRange[0]);
        const hi = simple_statistics_1.quantile(samples, histogramQuantileRange[1]);
        const range = hi - lo;
        const increment = range / (histogramMaxWidth - 1);
        const buckets = this.buckets = [];
        // Calculate the histogram bucket index of a sample value.
        const getIndex = (value) => Math.floor((value - lo) / increment);
        // Initialize the histogram data.
        const lastBucket = getIndex(hi);
        for (let i = 0; i <= lastBucket; i++) {
            buckets[i] = 0;
        }
        // Count sample values by bucket index.
        samples.forEach((value) => {
            if (value >= lo && value <= hi) {
                buckets[getIndex(value)]++;
            }
        });
        // Calculate normality measures.
        this.normalize = config.normalize;
        this.skewness = simple_statistics_1.sampleSkewness(samples);
        this.kurtosis = simple_statistics_1.sampleKurtosis(samples);
    }
    /*
     * Get a histogram as an ASCII string to output to the CLI.
     */
    toString() {
        const buckets = this.buckets;
        const height = simple_statistics_1.max(buckets) - simple_statistics_1.min(buckets);
        const plot = asciichart_1.default.plot(buckets, { height: Math.min(height, 12) });
        if (plot) {
            plot.split('\n')
                .map((line) => {
                const [n, rest] = line.split('.');
                return gray(n.substr(4)) + rest.substr(2, 2) + blue(rest.substr(4));
            })
                .join('\n');
            return gray(`normalized: ${this.normalize}  skewness: ${this.skewness.toFixed(2)}  kurtosis: ${this.kurtosis.toFixed(2)}\n${plot}`);
        }
    }
}
exports.default = Histogram;
//# sourceMappingURL=histogram.js.map