import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { zoomChanged } from 'store/actions';

import { generatePlot, cleanupPlots, updateZoom } from './plots';

export default class ViewBenchmarks extends LightningElement {
    allBenchmarks = [];

    @track visibleBenchmarks = [];
    needsRelayoutOfBenchmarks = false;

    viewTiming;
    @track viewBenchmark;
    @track viewMetric;

    viewZoom;
    hasSetInitialZoom = false;

    @track currentPoints = {};

    recentHoverData = [];

    @wire(connectStore, { store })
    storeChange({ benchmarks, view }) {
        if (
            this.allBenchmarks.length !== benchmarks.items.length ||
            this.viewBenchmark !== view.benchmark ||
            this.viewTiming !== view.timing
        ) {
            this.needsRelayoutOfBenchmarks = true;
            if (view.benchmark === 'all') {
                this.visibleBenchmarks = benchmarks.items;
            } else {
                this.visibleBenchmarks = benchmarks.items.filter(bench => bench.name === view.benchmark);
            }
            this.visibleBenchmarks = this.visibleBenchmarks.map(bench => ({
                ...bench,
                selectedPoints: []
            }))
            this.allBenchmarks = benchmarks.items;
        }

        if (this.viewMetric !== view.metric) {
            this.viewMetric = view.metric;
            this.needsRelayoutOfBenchmarks = true;
        }

        this.viewTiming = view.timing;
        this.viewBenchmark = view.benchmark;
        this.viewZoom = view.zoom;
    }

    timeout;
    handleRawClick(event, element, benchmarkIndex) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        } else {
            const grandParent = event.target.parentElement.parentElement;
            this.timeout = setTimeout(() => {
                if (grandParent !== element && this.recentHoverData) {
                    this.addAnnotation(element, this.recentHoverData, benchmarkIndex);
                }
                this.timeout = null;
            }, 200);
        }
    }

    addAnnotation(element, data, benchmarkIndex) {
        const point = data.points[0];
        const newIndex = (element.layout.annotations || []).length;

        const { x: commit } = point;
        const top = benchmarkIndex === "0" ? 400 * 1.15 : 400;
        const left = point.xaxis.l2p(point.xaxis.d2c(point.x)) + point.xaxis._offset;
        const commitPoint = { commit, top, left }

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

        if (newIndex) {
            let foundCopy = false;
            this.visibleBenchmarks[benchmarkIndex].selectedPoints.forEach((pastPoint, idx) => {
                if (pastPoint.commit === commitPoint.commit) {
                    window.Plotly.relayout(element, 'annotations[' + idx + ']', 'remove');
                    this.visibleBenchmarks[benchmarkIndex].selectedPoints.splice(idx, 1);
                    foundCopy = true;
                }
            })

            if (foundCopy) {
                return;
            }
        }

        const update = {
            [`annotations[${newIndex}]`]: annotation,
            'yaxis.range': point.yaxis.range // we don't want Plotly to change the yaxis bc of the annotation
        }

        window.Plotly.relayout(element, update);

        this.visibleBenchmarks[benchmarkIndex].selectedPoints.push(commitPoint);
    }

    handleHover(data) {
        this.recentHoverData = data;
    }

    handleZoom(update) {
        let shouldUpdate = true;
        for (const key of Object.keys(update)) {
            if (key.includes('annotations')) {
                shouldUpdate = false;
            }
        }

        if (shouldUpdate) {
            updateZoom(update, false);
            store.dispatch(zoomChanged(update));
        }
    }

    renderedCallback() {
        if (this.visibleBenchmarks.length && this.needsRelayoutOfBenchmarks) {
            this.needsRelayoutOfBenchmarks = false;
            cleanupPlots();
            const graphs = this.template.querySelectorAll('.graph');
            graphs.forEach((element, idx) => {
                const benchmarkIndex = element.dataset.index;
                const benchmark = this.visibleBenchmarks[benchmarkIndex];
                const isFirst = idx === 0;
                generatePlot(element, benchmark, this.viewMetric, isFirst);

                if (isFirst) {
                    element.addEventListener('click', event => this.handleRawClick(event, element, benchmarkIndex))
                    element.on('plotly_relayout', update => this.handleZoom(update));
                    element.on('plotly_hover', data => this.handleHover(data));
                }
            });

            if (!this.hasSetInitialZoom && this.viewZoom) {
                this.hasSetInitialZoom = true;

                // eslint-disable-next-line lwc/no-raf, @lwc/lwc/no-async-operation
                window.requestAnimationFrame(() => {
                    updateZoom(this.viewZoom, true);
                });
            }
        }
    }

    disconnectedCallback() {
        cleanupPlots();
    }
}
