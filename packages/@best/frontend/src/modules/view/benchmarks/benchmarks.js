import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { zoomChanged } from 'store/actions';

export default class ViewBenchmarks extends LightningElement {
    allBenchmarks = [];

    @track visibleBenchmarks = [];

    viewTiming;
    @track viewBenchmark;
    @track viewMetric;

    @track viewZoom;

    @wire(connectStore, { store })
    storeChange({ benchmarks, view }) {
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
            this.visibleBenchmarks = this.visibleBenchmarks.map((bench, idx) => ({
                ...bench,
                isFirst: idx === 0
            }))
            this.allBenchmarks = benchmarks.items;
        }

        if (this.viewMetric !== view.metric) {
            this.viewMetric = view.metric;
        }

        this.viewTiming = view.timing;
        this.viewBenchmark = view.benchmark;
        this.viewZoom = view.zoom;
    }

    handleZoom(event) {
        store.dispatch(zoomChanged(event.detail.update));
    }

    get hasStats() {
        return this.visibleBenchmarks.length > 0;
    }

    get numberOfBenchmarks() {
        return this.visibleBenchmarks.length;
    }

    get numberOfCommits() {
        const zoom = this.zoom;
        if (zoom) {
            const normalizedZoom = [Math.ceil(zoom[0]), Math.floor(zoom[1])]
            return (normalizedZoom[1] - normalizedZoom[0]) + 1;
        }

        const commitCounts = this.visibleBenchmarks.map(bench => bench.commits.length);
        return Math.max(...commitCounts);
    }

    get zoom() {
        if (this.viewZoom.hasOwnProperty('xaxis.range')) {
            return this.viewZoom['xaxis.range'];
        } else if (this.viewZoom.hasOwnProperty('xaxis.range[0]')) {
            return [this.viewZoom['xaxis.range[0]'], this.viewZoom['xaxis.range[1]']];
        }

        return false;
    }

    get startDate() {
        const zoom = this.zoom;
        const bench = this.visibleBenchmarks[0];
        if (! bench) {
            return '';
        }
        
        let date;
        if (zoom) {
            const beginIndex = Math.ceil(zoom[0]);
            date = bench.commitDates[beginIndex];
        }

        date = date || bench.commitDates[0];

        return (new Date(date)).toLocaleDateString('default', { month: 'long', day: 'numeric' });
    }

    get endDate() {
        const zoom = this.zoom;
        const bench = this.visibleBenchmarks[0];
        if (! bench) {
            return '';
        }
        
        let date;
        if (zoom) {
            const endIndex = Math.floor(zoom[1]);
            date = bench.commitDates[endIndex];
        }

        date = date || bench.commitDates[bench.commitDates.length - 1];

        return (new Date(date)).toLocaleDateString('default', { month: 'long', day: 'numeric' });
    }
}
