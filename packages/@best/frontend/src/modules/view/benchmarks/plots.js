/* global Plotly */

let PLOTS = [];

function buildPlottyLayout(title, isFirst) {
    return {
        height: isFirst ? 400 * 1.15 : 400,
        title,
        xaxis: {
            title: 'Commits',
            type: 'date',
            fixedrange: isFirst ? false : true,
            rangeslider: isFirst ? {thickness: 0.15, bgcolor: '#eee'} : {visible: false}
        },
        yaxis: {
            fixedrange: true,
            title: 'ms'
        },
        showlegend: false,
        side: 'bottom',
        autotick: false,
        colorway: ['#e7a4b6', '#17BECF']
    };
}

function buildLineTrend({ keys, values, name, commits }, showsVariation) {
    return {
        x: keys,
        y: values,
        text: commits.map(commit => commit.slice(0, 7)),
        mode: 'lines',
        name,
        line: {
            shape: 'spline',
            width: 3
        },
        opacity: 0.8,
        type: 'scatter',
        hoverinfo: 'text+y+x',
        fill: showsVariation ? 'none' : 'tozeroy'
    };
}

function buildVarianceTrend({ keys, values, name, commits }) {
    return {
        x: keys,
        y: values,
        text: commits.map(commit => commit.slice(0, 7)),
        mode: 'lines',
        name: name,
        line: {
            shape: 'spline',
            color: 'transparent'
        },
        fill: 'tonexty',
        fillcolor: 'rgba(0, 0, 50, 0.1)',
        showlegend: false,
        hoverinfo: 'skip'
    };
}

function buildTrend(object, showsVariation) {
    if (object.type === 'filled') {
        return buildVarianceTrend(object);
    } else if (object.type === 'line') {
        return buildLineTrend(object, showsVariation);
    }

    return {};
}

function sumArrays(array1, array2, mul = 1) {
    return array1.map((num, idx) => num + (mul * array2[idx]));
}

function buildCombinedValues(metrics, benchmark) {
    return metrics.map(metric => ([
        {
            commits: benchmark.commits,
            keys: benchmark.commitDates,
            values: metric.durations,
            name: metric.name,
            type: 'line'
        },
        {
            commits: benchmark.commits,
            keys: benchmark.commitDates,
            values: sumArrays(metric.durations, metric.stdDeviations, -1),
            name: metric.name + '-low',
            type: 'filled'
        },
        {
            commits: benchmark.commits,
            keys: benchmark.commitDates,
            values: sumArrays(metric.durations, metric.stdDeviations),
            name: metric.name + '-high',
            type: 'filled'
        }
    ]));
}

export function normalizeTitle(benchmarkName) {
    const parts = benchmarkName.split(':');
    parts.shift();
    return parts.join(':');
}

export async function generatePlot(element, benchmark, viewMetric, isFirst = false, showsVariation = true) {
    // const layout = buildPlottyLayout(normalizeTitle(benchmark.name), isFirst);
    const layout = buildPlottyLayout(benchmark.name, isFirst);

    const metrics = viewMetric === 'all' ? benchmark.metrics : benchmark.metrics.filter(metric => metric.name === viewMetric);
    
    let trends;
    if (showsVariation) {
        // create a combined dataset for graphing that has the low, high, and median values
        const combinedDatasets = buildCombinedValues(metrics, benchmark);
        
        // for each metric and then for each of (median, low, high) create the trend layout
        trends = combinedDatasets.flatMap(combined => combined.map(set => buildTrend(set, showsVariation)));
    } else {
        trends = metrics.map(metric => buildLineTrend({ commits: benchmark.commits, keys: benchmark.commitDates, values: metric.durations, name: metric.name }, showsVariation));
    }

    const plot = await window.Plotly.newPlot(element, trends, layout, {
        displaylogo: false,
        displayModeBar: false,
        scrollZoom: false,
        showTips: false,
        clickmode: 'event',
        hovermode: 'y',
        hoverdistance: 0
    });

    PLOTS.push(plot);
}

export function updateZoom(update, includeFirst) {
    if (includeFirst) {
        PLOTS.forEach(p => window.Plotly.relayout(p, update));
    } else {
        const allButFirst = PLOTS.slice(1)
        allButFirst.forEach(p => window.Plotly.relayout(p, update));
    }
}

export function cleanupPlots() {
    PLOTS = [];
}

let debounceResize = false;
window.onresize = function () {
    if (!debounceResize) {
        debounceResize = true;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            // eslint-disable-next-line lwc/no-raf, @lwc/lwc/no-async-operation
            window.requestAnimationFrame(() => {
                PLOTS.forEach((plot) => {
                    Plotly.Plots.resize(plot);
                });
                debounceResize = false;
            });
        }, 100);
    }
};
