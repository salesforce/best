/* global Plotly */

let PLOTS = [];

function buildPlottyLayout({ title }) {
    return {
        height: 250,
        // width: 800,
        title,
        xaxis: {
            title: 'Commits',
            // showgrid: false,
            fixedrange: true,
            anchor: 'y2',
        },
        yaxis1: {
            fixedrange: true,
            title: 'ms',
        },
        legend: {
            orientation: 'v',
            y: 0.5,
            font: {
                size: 12
            }
        },
        side: 'bottom'
    };
}

function buildPlottyTrace({ commits, values, metric }, opts) {
    return {
        // Using a zero-width char (https://en.wikipedia.org/wiki/Zero-width_space) to force plotty to render labels
        x: commits.map(c => '#\u200B' + c),
        y: values,
        mode: 'lines+markers',
        name: metric,
        line: {
            shape: 'spline',
            width: 3
        },
        opacity: 0.8,
        type: 'scatter',
    };
}

export function isPlot(element) {
    return PLOTS.includes(element);
}

function normalizeTitle(benchmarkName) {
    const parts = benchmarkName.split(':');
    parts.shift();
    return parts.join(':');
}

export async function generatePlot(element, benchmarkName, metrics) {
    const layout = buildPlottyLayout({ title: normalizeTitle(benchmarkName) });
    const data = Object.keys(metrics).map(metric => buildPlottyTrace(metrics[metric]));
    const plot = await window.Plotly.newPlot(element, data, layout, {
        displaylogo: false,
        displayModeBar: false,
        scrollZoom: false
    });

    PLOTS.push(plot);
}

export function cleanupPlots() {
    PLOTS = PLOTS.filter((plot) => plot.parentElement);
}

let debounceResize = false;
window.onresize = function() {
    if (!debounceResize) {
        debounceResize = true;
        setTimeout(() => {
            // eslint-disable-next-line lwc/no-raf
            window.requestAnimationFrame(() => {
                PLOTS.forEach((plot) => {
                    Plotly.Plots.resize(plot);
                });
                debounceResize = false;
            });
        }, 100);
    }

};
