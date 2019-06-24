import { LightningElement, track, api, wire } from 'lwc';
import { drawPlot, buildTrends, buildLayout, relayout, createAnnotation, removeAnnotation } from './plots';

import { connectStore, store } from 'store/store';
import { fetchComparison, comparisonChanged } from 'store/actions';

export default class ComponentBenchmark extends LightningElement {
    // PROPERTIES

    element;
    hasRegisteredHandlers = false;
    currentLayout = {};

    @track selectedPoints = [];
    recentHoverData;

    comparisonElement;
    @track pendingCommitsToCompare = new Set();
    @track viewComparisonCommits = [];
    @track comparisonResults = {};
    @track comparisonName = null;

    @wire(connectStore, { store })
    storeChanged({ view }) {
        this.comparisonResults = view.comparison.results;
        this.viewComparisonCommits = view.comparison.commits;
        this.comparisonName = view.comparison.benchmarkName;
    }

    @api metric;

    _first;
    @api
    get first() {
        return this._first;
    }

    set first(first) {
        this._first = first;

        this.currentLayout = buildLayout(this.benchmark.name, this.first);

        if (this.element) {
            relayout(this.element, this.currentLayout);
            
            // eslint-disable-next-line lwc/no-raf, @lwc/lwc/no-async-operation
            window.requestAnimationFrame(() => {
                this.updateGraphZoom();
            })
        }
    }

    allTrends = [];
    @track visibleTrends = [];

    _benchmark;
    @api
    get benchmark() {
        return this._benchmark;
    }

    set benchmark(benchmark) {
        this._benchmark = benchmark;
        this.allTrends = buildTrends(benchmark);
    }

    hasSetInitialZoom = false;
    _zoom;
    @api
    get zoom() {
        return this._zoom;
    }

    set zoom(zoom) {
        this._zoom = zoom;

        if (!zoom.origin || zoom.origin !== this.benchmark.name) {
            this.updateGraphZoom();
        }
    }

    // GETTERS

    get comparing() {
        return this.pendingCommitsToCompare.size > 0;
    }

    get showingComparison() {
        return this.viewComparisonCommits.length > 0;
    }

    get hasComparisonResults() {
        return Object.keys(this.comparisonResults).length > 0;
    }

    get containerClassNames() {
        return this.comparing ? 'comparing container' : 'container';
    }

    // METHODS

    handleRelayout(update) {
        const firstKey = Object.keys(update).shift();
        if (this.first && firstKey && firstKey.includes('xaxis')) { // make sure we are talking about zoom updates
            this.dispatchEvent(new CustomEvent('zoom', {
                detail: {
                    update: {
                        ...update,
                        origin: this.benchmark.name
                    }
                }
            }))
        }
    }

    updateGraphZoom() {
        if (this.element) {
            this.currentLayout = relayout(this.element, this.zoom);
        }
    }

    closeCommitInfo(event) {
        const { commit } = event.detail;

        this.selectedPoints.every((point, idx) => {
            if (point.commit === commit) {
                if (! point.pendingCompare) {
                    this.currentLayout = removeAnnotation(this.element, commit);
                }
                this.selectedPoints.splice(idx, 1);
                return false;
            }

            return true;
        })
    }

    rawClickHandler(event) {
        const grandParent = event.target.parentElement.parentElement;
        
        if (grandParent !== this.element && this.recentHoverData) {
            this.traceClicked();
        }
    }

    traceClicked() {
        const point = this.recentHoverData.points[0];

        const { x: commit } = point;
        const top = this.first ? 400 * 1.15 : 400;
        const left = point.xaxis.l2p(point.xaxis.d2c(point.x)) + point.xaxis._offset;
        const commitInfo = { commit, top, left, hidden: false, pendingCompare: this.pendingCommitsToCompare.has(commit) };

        const needsInsertion = this.selectedPoints.every((pastPoint, idx) => {
            if (pastPoint.commit === commit && !pastPoint.hidden) {
                return false;
            } else if (pastPoint.commit === commit && pastPoint.hidden) {
                this.selectedPoints[idx] = { ...commitInfo };
                return false;
            }

            return true;
        })

        if (needsInsertion && !this.comparing) {
            this.selectedPoints.push(commitInfo);
            this.currentLayout = createAnnotation(this.element, point);
        } else if (needsInsertion && this.comparing) {
            this.pendingCommitsToCompare.add(commit);
            this.selectedPoints.push({ ...commitInfo, hidden: true, pendingCompare: true });
            this.currentLayout = createAnnotation(this.element, point);
        }
    }

    hoverHandler(data) {
        this.recentHoverData = data;
    }

    updateVisibleTrends() {
        if (this.allTrends.length > 0) {
            this.visibleTrends = this.metric === 'all' ? this.allTrends : this.allTrends.filter(trend => trend.name.includes(this.metric));
        }
    }

    onCompareClick(event) {
        const { commit } = event.detail;

        const beingCompared = this.pendingCommitsToCompare.has(commit);

        if (beingCompared) {
            this.pendingCommitsToCompare.delete(commit)

            this.selectedPoints.every((pastPoint, idx) => {
                if (pastPoint.commit === commit && !pastPoint.hidden) {
                    this.selectedPoints[idx] = { ...pastPoint, pendingCompare: false };
                    return false;
                }
    
                return true;
            })
        } else {
            this.pendingCommitsToCompare.add(commit);

            this.selectedPoints.every((pastPoint, idx) => {
                if (pastPoint.commit === commit && !pastPoint.hidden) {
                    this.selectedPoints[idx] = { ...pastPoint, hidden: true, pendingCompare: true };
                    return false;
                }
    
                return true;
            })
        }
    }

    runComparison() {
        store.dispatch(fetchComparison(this.benchmark.name, [...this.pendingCommitsToCompare]));
    }

    closeModal() {
        this.comparisonElement = null;
        store.dispatch(comparisonChanged());
    }

    async renderedCallback() {
        if (!this.element) this.element = this.template.querySelector('.graph');

        this.updateVisibleTrends();

        this.currentLayout = await drawPlot(this.element, this.visibleTrends, this.currentLayout);

        if (!this.hasRegisteredHandlers) {
            this.hasRegisteredHandlers = true;
            this.element.addEventListener('click', event => this.rawClickHandler(event));

            this.element.on('plotly_hover', data => this.hoverHandler(data));

            this.element.on('plotly_relayout', update => this.handleRelayout(update));
        }

        if (!this.hasSetInitialZoom) {
            this.hasSetInitialZoom = true;
            this.updateGraphZoom();
        }

        // COMPARISON
        // fetch comparison results if all we have is the commits from the url
        if (this.showingComparison && !this.hasComparisonResults && this.comparisonName === this.benchmark.name) {
            store.dispatch(fetchComparison(this.benchmark.name, this.viewComparisonCommits));
        }

        if (this.showingComparison && this.hasComparisonResults) {
            if (! this.comparisonElement) this.comparisonElement = this.template.querySelector('.comparison-graph');

            if (this.comparisonElement) {
                const comparisonTrend = buildTrends(this.comparisonResults, true, true);
                const initialComparisonLayout = buildLayout(this.comparisonResults.name, false);
                await drawPlot(this.comparisonElement, comparisonTrend, initialComparisonLayout)
            }
        }
    }
}