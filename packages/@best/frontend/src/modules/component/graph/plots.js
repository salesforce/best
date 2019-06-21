export function buildLayout(title, isFirst) {
    return {
        height: isFirst ? 400 * 1.15 : 400,
        title,
        xaxis: {
            title: 'Commits',
            fixedrange: isFirst ? false : true,
            nticks: 15,
            rangeslider: isFirst ? {thickness: 0.15, bgcolor: '#eee'} : {visible: false}
        },
        yaxis: {
            fixedrange: true,
            title: 'ms',
            zeroline: false
        },
        showlegend: false,
        side: 'bottom',
        colorway: ['#e7a4b6', '#17BECF']
    };
}

function buildLineTrend({ dates, values, name, commits }, showsVariation) {
    return {
        y: values,
        x: commits.map(commit => commit.slice(0, 7)),
        text: dates,
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

function buildVarianceTrend({ dates, values, name, commits }) {
    return {
        y: values,
        x: commits.map(commit => commit.slice(0, 7)),
        text: dates,
        mode: 'lines',
        name: name,
        line: {
            shape: 'spline',
            color: 'transparent'
        },
        fill: 'tonexty',
        fillcolor: name.includes('high') ? 'rgba(0, 0, 50, 0.1)' : 'transparent',
        // fillcolor: 'rgba(0, 0, 50, 0.1)',
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
            dates: benchmark.commitDates,
            values: metric.durations,
            name: metric.name,
            type: 'line'
        },
        {
            commits: benchmark.commits,
            dates: benchmark.commitDates,
            values: sumArrays(metric.durations, metric.stdDeviations, -1),
            name: metric.name + '-low',
            type: 'filled'
        },
        {
            commits: benchmark.commits,
            dates: benchmark.commitDates,
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

export function buildTrends(benchmark, showsVariation = true) {
    let trends;
    if (showsVariation) {
        // create a combined dataset for graphing that has the low, high, and median values
        const combinedDatasets = buildCombinedValues(benchmark.metrics, benchmark);
        
        // for each metric and then for each of (median, low, high) create the trend layout
        trends = combinedDatasets.flatMap(combined => combined.map(set => buildTrend(set, showsVariation)));
    } else {
        trends = benchmark.metrics.map(metric => buildLineTrend({ commits: benchmark.commits, keys: benchmark.commitDates, values: metric.durations, name: metric.name }, showsVariation));
    }

    return trends;
}

export async function drawPlot(element, trends, layout) {
    await window.Plotly.react(element, trends, layout, {
        displaylogo: false,
        displayModeBar: false,
        scrollZoom: false,
        showTips: false,
        responsive: true
    });

    return element.layout;
}

export function relayout(element, update) {
    window.Plotly.relayout(element, update);

    return element.layout;
}

export function createAnnotation(element, point) {
    const annotation = {
        x: point.x,
        y: point.yaxis.range[0],
        xref: 'x',
        yref: 'y',
        showarrow: true,
        arrowcolor: '#aaa',
        text: '',
        arrowhead: 0,
        ax: 0,
        ay: point.yaxis.range[1],
        ayref: 'y',
    }

    const newIndex = (element.layout.annotations || []).length;

    const update = {
        [`annotations[${newIndex}]`]: annotation,
        'yaxis.range': point.yaxis.range // we don't want Plotly to change the yaxis bc of the annotation
    }

    return relayout(element, update);
}

export function removeAnnotation(element, idx) {
    window.Plotly.relayout(element, `annotations[${idx}]`, 'remove');

    return element.layout;
}