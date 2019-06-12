import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { zoomChanged } from 'store/actions';

export default class ViewBenchmarks extends LightningElement {
    allBenchmarks = [];

    @track visibleBenchmarks = [];
    needsRelayoutOfBenchmarks = false;

    viewTiming;
    @track viewBenchmark;
    @track viewMetric;

    @track viewZoom;
    hasSetInitialZoom = false;

    @track currentPoints = {};

    recentHoverData = [];
    cacheQuerySelectorGraph = [];

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
            this.visibleBenchmarks = this.visibleBenchmarks.map((bench, idx) => ({
                ...bench,
                selectedPoints: [],
                isFirst: idx === 0
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

    handleZoom(event) {
        store.dispatch(zoomChanged(event.detail.update));
    }
}
