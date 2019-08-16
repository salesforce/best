/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import fs from 'fs';
import { promisify } from 'util';
import { BenchmarkResults, BenchmarkMetrics, BenchmarkResultNode, BenchmarkMeasureType } from '@best/types';

const asyncReadFile = promisify(fs.readFile);
const asyncUnlink = promisify(fs.unlink);
const asyncExists = promisify(fs.exists);
const TRACED_METRIC_EVENTS = ['Paint', 'Layout']

interface TracedMetrics {
    [key: string]: BenchmarkMetrics
}

const isBeginPhase = (event: { ph: string }): boolean => {
    return event.ph.toLowerCase() === 'b';
}

const isEndPhase = (event: { ph: string }): boolean => {
    return event.ph.toLowerCase() === 'e';
}

const hasDurationPhased = (event: { ph: string }): boolean => {
    return isBeginPhase(event) || isEndPhase(event);
}

const sumPairedMetrics = (events: any[]): number => {
    let duration = 0;

    for (const event of events) {
        if (isBeginPhase(event)) {
            duration -= event.ts;
        } else if (isEndPhase(event)) {
            duration += event.ts;
        }
    }

    return duration;
}

// returns the total duration of all paints or layouts, etc in microseconds
const sumEventDurations = (events: any[]): number => {
    const pairedMetrics = events.filter(hasDurationPhased);
    if (pairedMetrics.length > 0 && pairedMetrics.length % 2 === 0) {
        return sumPairedMetrics(events);
    }

    return events.reduce((previous, current) => previous += current.dur, 0);
}

export const parseTrace = async (tracePath: string): Promise<TracedMetrics> => {
    const file = await asyncReadFile(tracePath, 'utf8');
    const trace = JSON.parse(file);
    const tracedMetricEvents = trace.traceEvents.filter((event: any) => TRACED_METRIC_EVENTS.includes(event.name) || event.name.includes((`${BenchmarkMeasureType.Execute}/`)));
    const sortedEvents = tracedMetricEvents.sort((a: any, b: any) => a.ts - b.ts);

    const groupedEvents: { [run: string]: { [event: string]: any[] } } = {};
    let currentRun: string | false = false;

    for (const event of sortedEvents) {
        if (TRACED_METRIC_EVENTS.includes(event.name) && currentRun) {
            if (groupedEvents[currentRun][event.name]) {
                groupedEvents[currentRun][event.name].push(event);
            } else {
                groupedEvents[currentRun][event.name] = [event];
            }
        } else if (event.name.includes(`${BenchmarkMeasureType.Execute}/`)) {
            if (isBeginPhase(event)) {
                currentRun = event.name;
                groupedEvents[event.name] = {};
            } else if (isEndPhase(event)) {
                currentRun = false;
            }
        }
    }

    const tracedMetrics = Object.keys(groupedEvents).reduce((allMetrics, key): TracedMetrics => {
        const runName = key.replace((`${BenchmarkMeasureType.Execute}/`), '');
        const metrics = Object.keys(groupedEvents[key]).reduce((acc, eventName): BenchmarkMetrics => {
            const name = eventName.toLowerCase();
            return {
                ...acc,
                [name]: (sumEventDurations(groupedEvents[key][eventName]) / 1000)
            }
        }, <BenchmarkMetrics>{})

        return {
            ...allMetrics,
            [runName]: metrics
        };
    }, <TracedMetrics>{})

    return tracedMetrics;
}

const mergeTracedMetricsIntoResultNode = (resultNode: BenchmarkResultNode, parsedTrace: TracedMetrics) => {
    if (resultNode.type === "group") {
        resultNode.nodes.forEach(node => {
            mergeTracedMetricsIntoResultNode(node, parsedTrace);
        })
    } else if (resultNode.type === "benchmark") {
        const nodeTraces = parsedTrace[resultNode.name];
        resultNode.metrics = {
            ...resultNode.metrics,
            ...nodeTraces
        }
    }
}

export const mergeTracedMetrics = (benchmarkResults: BenchmarkResults, parsedTrace: TracedMetrics) => {
    benchmarkResults.results.forEach(node => {
        mergeTracedMetricsIntoResultNode(node, parsedTrace);
    })
}

export const removeTrace = async (tracePath: string): Promise<void> => {
    const fileExists = await asyncExists(tracePath);

    if (fileExists) {
        await asyncUnlink(tracePath);
    }
}