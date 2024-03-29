const colorForName = (name, fill) => {
    const normalizedName = name.replace(/-(low|high)/, '');

    const colors = {
        script: ['#241E4E', 'rgba(36, 30, 78, 0.08)'],
        aggregate: ['#FF1E4E', 'rgba(255, 30, 78, 0.08)'],
        paint: ['#17BECF', 'rgba(23, 190, 207, 0.15)'],
        layout: ['#27D046', 'rgba(39, 208, 70, 0.08)'],
        system: ['#9DA39A', 'rgba(157, 163, 154, 0.08)'],
        idle: ['#54494B', 'rgba(84, 73, 75, 0.08)'],
        recalculatestyles: ['#C490D1', 'rgba(196, 144, 209, 0.8)'],
        updatelayertree: ['#D2BF55', 'rgba(210, 191, 85, 0.8)'],
        compositelayers: ['#CEFF1A', 'rgba(206, 255, 26, 0.8)'],
        'first-paint': ['#17BECF', 'rgba(23, 190, 207, 0.15)'],
        duration: ['#FF1E4E', 'rgba(255, 30, 78, 0.08)'], // old metrics
    };

    const colorIndex = fill ? 0 : 1;

    if (!colors[normalizedName]) {
        return 'rgba(0, 0, 0, 0)';
    }

    return colors[normalizedName][colorIndex];
};

export function buildLayout(title, isFirst) {
    return {
        height: isFirst ? 400 * 1.15 : 400,
        xaxis: {
            title: 'Commits',
            fixedrange: isFirst ? false : true,
            nticks: 15,
            rangeslider: isFirst ? { thickness: 0.15, bgcolor: '#eee' } : { visible: false },
        },
        yaxis: {
            fixedrange: true,
            title: 'ms',
            zeroline: false,
        },
        showlegend: isFirst ? true : false,
        legend: {
            x: 1,
            y: 1.02,
            orientation: 'h',
            traceorder: 'reversed',
            itemclick: false,
            itemdoubleclick: false,
            xanchor: 'right',
        },
        side: 'bottom',
        margin: {
            t: 0,
        },
    };
}

function buildLineTrend({ dates, values, name, commits }, showsVariation) {
    return {
        y: values,
        x: commits.map((commit) => commit.slice(0, 7)),
        text: dates,
        mode: 'lines+markers',
        name,
        line: {
            shape: 'spline',
            width: 2,
            color: colorForName(name, true),
        },
        opacity: 0.8,
        type: 'scatter',
        hoveron: 'points+fills',
        hovertemplate: '%{y}ms<br>%{text}<extra></extra>',
        fill: showsVariation ? 'none' : 'tozeroy',
    };
}

function buildVarianceTrend({ dates, values, name, commits }) {
    return {
        y: values,
        x: commits.map((commit) => commit.slice(0, 7)),
        text: dates,
        mode: 'lines',
        name: name,
        line: {
            shape: 'spline',
            color: 'transparent',
        },
        fill: 'tonexty',
        fillcolor: name.includes('high') ? colorForName(name, false) : 'transparent',
        showlegend: false,
        hoverinfo: 'skip',
        hoveron: 'fills',
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
    return array1.map((num, idx) => num + mul * array2[idx]);
}

function buildCombinedValues(metrics, benchmark) {
    return metrics.map((metric) => [
        {
            commits: benchmark.commits,
            dates: benchmark.commitDates,
            values: metric.durations,
            name: metric.name,
            type: 'line',
        },
        {
            commits: benchmark.commits,
            dates: benchmark.commitDates,
            values: sumArrays(metric.durations, metric.stdDeviations, -1),
            name: metric.name + '-low',
            type: 'filled',
        },
        {
            commits: benchmark.commits,
            dates: benchmark.commitDates,
            values: sumArrays(metric.durations, metric.stdDeviations),
            name: metric.name + '-high',
            type: 'filled',
        },
    ]);
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
        trends = combinedDatasets.flatMap((combined) => combined.map((set) => buildTrend(set, showsVariation)));
    } else {
        trends = benchmark.metrics.map((metric) =>
            buildLineTrend(
                {
                    commits: benchmark.commits,
                    keys: benchmark.commitDates,
                    values: metric.durations,
                    name: metric.name,
                },
                showsVariation,
            ),
        );
    }

    return trends;
}

export async function drawPlot(element, trends, layout) {
    await window.Plotly.react(element, trends, layout, {
        displaylogo: false,
        displayModeBar: false,
        scrollZoom: false,
        showTips: false,
        responsive: true,
        doubleClick: false,
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
        // yref: 'y',
        showarrow: true,
        arrowcolor: '#aaa',
        text: '',
        arrowhead: 0,
        ax: 0,
        ay: point.yaxis.range[1],
        ayref: 'y',
        _commit: point.x,
    };

    const newIndex = (element.layout.annotations || []).length;

    const update = {
        [`annotations[${newIndex}]`]: annotation,
        'yaxis.range': point.yaxis.range, // we don't want Plotly to change the yaxis bc of the annotation
    };

    return relayout(element, update);
}

export function createInconsistencyAnnotation(element, x) {
    const annotation = {
        x,
        y: element.layout.yaxis.range[0],
        xref: 'x',
        yref: 'y',
        showarrow: true,
        arrowcolor: '#f00',
        text: '⚠️',
        arrowhead: 0,
        ax: 0,
        ay: element.layout.yaxis.range[0],
        ayref: 'y',
    };

    const newIndex = (element.layout.annotations || []).length;

    const update = {
        [`annotations[${newIndex}]`]: annotation,
        'yaxis.range': element.layout.yaxis.range, // we don't want Plotly to change the yaxis bc of the annotation
    };

    return relayout(element, update);
}

export function removeAnnotation(element, commit) {
    element.layout.annotations.every((annotation, idx) => {
        if (annotation._commit === commit) {
            window.Plotly.relayout(element, `annotations[${idx}]`, 'remove');
            return false;
        }
        return true;
    });

    if (!element.layout.annotations || element.layout.annotations.length === 0) {
        window.Plotly.relayout(element, {
            'yaxis.autorange': true,
        });
    }

    return element.layout;
}
