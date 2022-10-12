/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import chart from 'asciichart';
import { min, max, quantile, sampleSkewness, sampleKurtosis } from 'simple-statistics';
import chalk from 'chalk';
const { gray, blue } = chalk;

/*
 * Ascii Histograms for CLI output.
 */
export default class Histogram {
    buckets: any;
    normalize: any;
    skewness: number;
    kurtosis: number;
    /*
     * Assign sample values to buckets.
     */
    constructor(samples: any, config: any) {
        // Optionally normalize log-normal distributions by taking an adjusted logarithm of each sample.
        if (config.normalize === 'log-normal') {
            const offset = min(samples) - 0.1;
            samples = samples.map((x: any) => Math.log(x - offset));
        }
        const { histogramMaxWidth, histogramQuantileRange } = config;
        const lo = quantile(samples, histogramQuantileRange[0]);
        const hi = quantile(samples, histogramQuantileRange[1]);
        const range = hi - lo;
        const increment = range / (histogramMaxWidth - 1);
        const buckets: any = (this.buckets = []);

        // Calculate the histogram bucket index of a sample value.
        const getIndex = (value: number) => Math.floor((value - lo) / increment);

        // Initialize the histogram data.
        const lastBucket = getIndex(hi);
        for (let i = 0; i <= lastBucket; i++) {
            buckets[i] = 0;
        }

        // Count sample values by bucket index.
        samples.forEach((value: any) => {
            if (value >= lo && value <= hi) {
                buckets[getIndex(value)]++;
            }
        });

        // Calculate normality measures.
        this.normalize = config.normalize;
        this.skewness = sampleSkewness(samples);
        this.kurtosis = sampleKurtosis(samples);
    }
    /*
     * Get a histogram as an ASCII string to output to the CLI.
     */
    toString() {
        const buckets = this.buckets;
        const height = max(buckets) - min(buckets);
        const plot = chart.plot(buckets, { height: Math.min(height, 12) });
        if (plot) {
            plot.split('\n')
                .map((line: any) => {
                    const [n, rest] = line.split('.');
                    return gray(n.substr(4)) + rest.substr(2, 2) + blue(rest.substr(4));
                })
                .join('\n');

            return gray(
                `normalized: ${this.normalize}  skewness: ${this.skewness.toFixed(
                    2,
                )}  kurtosis: ${this.kurtosis.toFixed(2)}\n${plot}`,
            );
        }
    }
}
