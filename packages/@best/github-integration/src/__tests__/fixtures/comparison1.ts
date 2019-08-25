/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { BenchmarkComparison } from '@best/types';

const comparison: BenchmarkComparison = {
  "baseCommit": "abcdef0",
  "targetCommit": "1234567",
  "comparisons": [
    {
      "type": "project",
      "name": "project-foo",
      "comparisons": [
        {
          "type": "group",
          "name": "bar.benchmark",
          "comparisons": [
            {
              "type": "group",
              "name": "bar 1",
              "comparisons": [
                {
                  "type": "benchmark",
                  "name": "fibonacci 15",
                  "metrics": {
                    "script": {
                      "baseStats": {
                        "samples": [
                          0.195,
                          0.135,
                          0.14,
                          0.345,
                          0.135
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.19,
                        "median": 0.14,
                        "variance": 0.007,
                        "medianAbsoluteDeviation": 0.005
                      },
                      "targetStats": {
                        "samples": [
                          0.225,
                          0.125,
                          0.17,
                          0.23,
                          0.145
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.179,
                        "median": 0.17,
                        "variance": 0.002,
                        "medianAbsoluteDeviation": 0.045
                      },
                      "samplesComparison": 0
                    },
                    "aggregate": {
                      "baseStats": {
                        "samples": [
                          1.27,
                          0.28,
                          0.305,
                          0.775,
                          0.56
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.638,
                        "median": 0.56,
                        "variance": 0.133,
                        "medianAbsoluteDeviation": 0.255
                      },
                      "targetStats": {
                        "samples": [
                          1.505,
                          0.575,
                          0.78,
                          0.475,
                          0.735
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.814,
                        "median": 0.735,
                        "variance": 0.131384,
                        "medianAbsoluteDeviation": 0.160
                      },
                      "samplesComparison": 0
                    }
                  }
                },
                {
                  "type": "benchmark",
                  "name": "fibonacci 38",
                  "metrics": {
                    "script": {
                      "baseStats": {
                        "samples": [
                          498.465,
                          475.37,
                          473.74,
                          478.11,
                          471.91
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 479.519,
                        "median": 475.37,
                        "variance": 93.889,
                        "medianAbsoluteDeviation": 2.740
                      },
                      "targetStats": {
                        "samples": [
                          478.37,
                          476.67,
                          471.725,
                          482.67,
                          479.44
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 477.775,
                        "median": 478.37,
                        "variance": 12.982,
                        "medianAbsoluteDeviation": 1.7
                      },
                      "samplesComparison": 0
                    },
                    "aggregate": {
                      "baseStats": {
                        "samples": [
                          498.735,
                          475.635,
                          473.955,
                          478.305,
                          472.14
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 479.754,
                        "median": 475.635,
                        "variance": 94.189,
                        "medianAbsoluteDeviation": 2.670
                      },
                      "targetStats": {
                        "samples": [
                          478.61,
                          477.005,
                          471.93,
                          482.89,
                          479.71
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 478.029,
                        "median": 478.61,
                        "variance": 13.008,
                        "medianAbsoluteDeviation": 1.605
                      },
                      "samplesComparison": 0
                    }
                  }
                }
              ]
            }
          ]
        },
        {
          "type": "group",
          "name": "baz.benchmark",
          "comparisons": [
            {
              "type": "group",
              "name": "baz 1",
              "comparisons": [
                {
                  "type": "benchmark",
                  "name": "fibonacci",
                  "metrics": {
                    "script": {
                      "baseStats": {
                        "samples": [
                          0.215,
                          0.25,
                          0.355,
                          0.325,
                          0.355
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.3,
                        "median": 0.325,
                        "variance": 0.003,
                        "medianAbsoluteDeviation": 0.03
                      },
                      "targetStats": {
                        "samples": [
                          0.185,
                          0.2,
                          0.16,
                          0.19,
                          0.375
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.222,
                        "median": 0.19,
                        "variance": 0.006,
                        "medianAbsoluteDeviation": 0.01
                      },
                      "samplesComparison": 0
                    },
                    "aggregate": {
                      "baseStats": {
                        "samples": [
                          1.29,
                          1.02,
                          0.735,
                          0.585,
                          0.615
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.849,
                        "median": 0.735,
                        "variance": 0.072,
                        "medianAbsoluteDeviation": 0.15
                      },
                      "targetStats": {
                        "samples": [
                          1.22,
                          0.885,
                          0.335,
                          0.675,
                          0.705
                        ],
                        "sampleSize": 5,
                        "samplesQuantileThreshold": 0.8,
                        "mean": 0.764,
                        "median": 0.705,
                        "variance": 0.084,
                        "medianAbsoluteDeviation": 0.180
                      },
                      "samplesComparison": 0
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

export default comparison;