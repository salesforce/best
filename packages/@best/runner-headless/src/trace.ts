import fs from 'fs';
import { promisify } from 'util';
import { BenchmarkResults, BenchmarkMetrics, BenchmarkResultNode } from '@best/types';

const asyncReadFile = promisify(fs.readFile);
const asyncUnlink = promisify(fs.unlink);

interface TracedMetrics {
    [key: string]: BenchmarkMetrics
}

export const removeTrace = (tracePath: string): Promise<void> => {
    return asyncUnlink(tracePath);
}

export const parseTrace = async (tracePath: string): Promise<TracedMetrics> => {
    const file = await asyncReadFile(tracePath, 'utf8');
    const trace = JSON.parse(file);
    const events = trace.traceEvents;
    const executesAndPaints = events.filter((event: any) => event.name === 'Paint' || event.name.includes('BEST/execute/')).sort((a: any, b: any) => a.ts - b.ts);

    const groupedPaints: { [key: string]: any[] } = {};
    let currentRun: string | false = false;

    for (const event of executesAndPaints) {
        if (event.name === 'Paint' && currentRun) {
            groupedPaints[currentRun].push(event);
        } else if (event.name.includes('BEST/execute/')) {
            if (event.ph === 'b') {
                currentRun = event.name;
                groupedPaints[event.name] = []
            } else if (event.ph === 'e') {
                currentRun = false;
            }
        }
    }

    // TODO: add support for fetching multiple metrics (paint & layout)
    const metrics = Object.keys(groupedPaints).reduce((acc, key): TracedMetrics => {
        const paintDuration: number = groupedPaints[key].reduce((previous, current) => previous += current.dur, 0);
        const runName = key.replace('BEST/execute/', '');
        acc[runName] = { paint: paintDuration };
        return acc;
    }, <TracedMetrics>{})

    return metrics;
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