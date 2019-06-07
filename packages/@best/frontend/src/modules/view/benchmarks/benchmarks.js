import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { zoomChanged } from 'store/actions';

import { generatePlot, cleanupPlots, updateZoom } from './plots';

export default class ViewBenchmarks extends LightningElement {
    allBenchmarks = [];

    @track visibleBenchmarks = [];

    viewTiming;
    @track viewBenchmark;
    @track viewMetric;

    viewZoom;
    hasSetInitialZoom = false;

    @track currentPoints = [];

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

    handleClick(data, name) {
        // TODO: fix this implementation
        // console.log(data.points.length)
        // const { x, y, text } = data.points[0];
        // console.log(data.points)
        // this.currentPoints = this.currentPoints.filter(point => point.name !== name);
        // this.currentPoints.push({ x, y, text, name })
    }

    handleZoom(update) {
        updateZoom(update, false);
        store.dispatch(zoomChanged(update));
    }

    renderedCallback() {
        if (this.visibleBenchmarks.length) {
            cleanupPlots();
            const graphs = this.template.querySelectorAll('.graph');
            graphs.forEach((element, idx) => {
                const benchmarkIndex = element.dataset.index;
                const benchmark = this.visibleBenchmarks[benchmarkIndex];
                const isFirst = idx === 0;
                generatePlot(element, benchmark, this.viewMetric, isFirst);

                if (isFirst) {
                    // TODO: make sure this is NOT going to be a memory leak
                    element.on('plotly_relayout', update => this.handleZoom(update));
                }

                element.on('plotly_click', data => this.handleClick(data, benchmark.name));
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
