import { LightningElement, track, wire } from 'lwc';

import { ConnectStore, store } from 'store/store';
import { timingChanged, benchmarksChanged, metricsChanged, zoomChanged } from 'store/actions';

export default class ComponentMenubar extends LightningElement {
    @track benchmarkNames = [];
    @track metricNames = [];

    @track viewTiming;
    @track viewBenchmark;
    @track viewMetric;
    @track viewZoom = {};

    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(ConnectStore, { store })
    storeChange({ benchmarks, view }) {
        this.benchmarkNames = benchmarks.items.map((bench) => bench.name);

        const metricSet = new Set(benchmarks.items.flatMap((bench) => bench.metrics.map((metric) => metric.name)));
        this.metricNames = [...metricSet];

        this.viewTiming = view.timing;
        this.viewBenchmark = view.benchmark;
        this.viewMetric = view.metric;
        this.viewZoom = view.zoom;
    }

    get timingOptions() {
        const items = [
            {
                title: 'Past 2 Months',
                id: '2-months',
            },
            {
                title: 'Since Last Release',
                id: 'last-release',
            },
            {
                title: 'All Time',
                id: 'all',
            },
        ];

        const selectedItems = items.filter((item) => item.id === this.viewTiming);

        return {
            multiple: false,
            items,
            selectedItems,
        };
    }

    timingUpdated(event) {
        const timing = event.detail.selectedItems[0];
        store.dispatch(timingChanged(timing.id));
    }

    get benchmarkOptions() {
        const items = [
            { id: 'all', title: 'All Benchmarks' },
            ...this.benchmarkNames.map((name) => ({ id: name, title: name })),
        ];
        const selectedItems = items.filter((item) => item.id === this.viewBenchmark);

        return {
            multiple: false,
            items,
            selectedItems,
        };
    }

    benchmarkUpdated(event) {
        const benchmark = event.detail.selectedItems[0];
        store.dispatch(benchmarksChanged(benchmark.id));
    }

    get metricOptions() {
        const items = [
            { id: 'all', title: 'All Metrics' },
            ...this.metricNames.map((name) => ({ id: name, title: name })),
        ];
        const selectedItems = items.filter((item) => item.id === this.viewMetric);

        return {
            multiple: false,
            items,
            selectedItems,
        };
    }

    metricUpdated(event) {
        const metric = event.detail.selectedItems[0];
        store.dispatch(metricsChanged(metric.id));
    }

    get isZoomed() {
        return (
            Object.prototype.hasOwnProperty.call(this.viewZoom, 'xaxis.range') ||
            Object.prototype.hasOwnProperty.call(this.viewZoom, 'xaxis.range[0]')
        );
    }

    zoomUpdated() {
        store.dispatch(
            zoomChanged({
                'xaxis.autorange': true,
            }),
        );
    }
}
