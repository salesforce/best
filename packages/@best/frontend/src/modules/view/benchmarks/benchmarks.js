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

    @track currentPoints = [];

    recentHoverData = [];

    @wire(connectStore, { store })
    storeChange({ benchmarks, view }) {
        // explanation:
        // every time we "set" this.visibleBenchmarks it triggers a re-render
        // even if there is no different in the values
        // this is bad bc it messes up with zooming, etc
        // so we must only "set" this.visibleBenchmarks when there is an actual difference
        // and these are all the possible reasons that benchmarks would change

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
            this.allBenchmarks = benchmarks.items;
        }

        this.viewTiming = view.timing;
        this.viewBenchmark = view.benchmark;
        this.viewMetric = view.metric;
        this.viewZoom = view.zoom;
    }

    get hasPoints() {
        return !!this.currentPoints.length;
    }

    timeout;
    handleRawClick(event, element) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        } else {
            this.timeout = setTimeout(() => {
                const grandParent = event.target.parentElement.parentElement;
                if (grandParent !== element && this.recentHoverData.length > 0) {
                    // TODO: we need to debounce this so that we don't interfere with double clicks to reset zoom
                    this.addAnnotation(element, this.recentHoverData[0]);
                }
                this.timeout = null;
            }, 200);
        }
    }

    addAnnotation(element, point) {
        const newIndex = (element.layout.annotations || []).length;

        const date = new Date(point.text);
        const text = `#${point.x} (${date.toDateString()})<br>${point.y} ms`;

        const annotation = {
            x: point.x,
            y: point.y,
            xref: 'x',
            yref: 'y',
            showarrow: true,
            text: text,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            borderwidth: 2,
            arrowhead: 6,
            ax: 0,
            ay: -80,
            ayref: 'y',
            borderpad: 4,
            bordercolor: point.fullData.line.color
        }

        if (newIndex) {
            let foundCopy = false;
            element.layout.annotations.forEach((ann, idx) => {
                if (ann.text === annotation.text) {
                    window.Plotly.relayout(element, 'annotations[' + idx + ']', 'remove');
                    this.currentPoints.splice(idx, 1);
                    foundCopy = true;
                }
            })

            if (foundCopy) {
                return;
            }
        }

        window.Plotly.relayout(element, `annotations[${newIndex}]`, annotation);
        const { x: commit } = point;
        this.currentPoints.push({ commit });
    }

    handleHover(data) {
        this.recentHoverData = data.points;
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
                    // TODO: make sure this is NOT going to be a memory leak
                    element.addEventListener('click', event => this.handleRawClick(event, element))
                    element.on('plotly_relayout', update => this.handleZoom(update));
                    element.on('plotly_hover', data => this.handleHover(data));
                }
            });

            if (!this.hasSetInitialZoom && this.viewZoom) {
                this.hasSetInitialZoom = true;

                // we need to call rAF because otherwise the graphs are created yet
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
