import { LightningElement, track, api } from 'lwc';
import { drawPlot, buildTrends, buildLayout, relayout, createAnnotation, removeAnnotation } from './plots';

export default class ComponentGraph extends LightningElement {
    element;
    hasRegisteredHandlers = false;
    currentLayout = {};

    @track selectedPoints = [];
    recentHoverData;

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
                this.currentLayout = removeAnnotation(this.element, idx);
                this.selectedPoints.splice(idx, 1);
                return false;
            }

            return true;
        })
    }

    timeout = null;
    rawClickHandler(event) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        } else {
            const grandParent = event.target.parentElement.parentElement;
            this.timeout = setTimeout(() => {
                if (grandParent !== this.element && this.recentHoverData) {
                    this.traceClicked();
                }

                this.timeout = null;
            }, 200);
        }
    }

    traceClicked() {
        const point = this.recentHoverData.points[0];

        const { x: commit } = point;
        const top = this.first ? 400 * 1.15 : 400;
        const left = point.xaxis.l2p(point.xaxis.d2c(point.x)) + point.xaxis._offset;
        const commitInfo = { commit, top, left }

        this.selectedPoints.every((pastPoint, idx) => {
            if (pastPoint.commit === commit) {
                this.selectedPoints.splice(idx, 1);
                this.currentLayout = removeAnnotation(this.element, idx);
                return false;
            }

            return true;
        })

        this.selectedPoints.push(commitInfo);
        this.currentLayout = createAnnotation(this.element, point);
    }

    hoverHandler(data) {
        this.recentHoverData = data;
    }

    updateVisibleTrends() {
        if (this.allTrends.length > 0) {
            this.visibleTrends = this.metric === 'all' ? this.allTrends : this.allTrends.filter(trend => trend.name.includes(this.metric));
        }
    }

    async renderedCallback() {
        if (!this.element) this.element = this.template.querySelector('.graph');

        this.updateVisibleTrends();

        this.currentLayout = await drawPlot(this.element, this.visibleTrends, this.currentLayout);

        if (!this.hasRegisteredHandlers) {
            this.hasRegisteredHandlers = true;
            this.element.addEventListener('click', event => this.rawClickHandler(event));

            if (this.first) {
                this.element.on('plotly_relayout', update => this.handleRelayout(update));
            }

            this.element.on('plotly_hover', data => this.hoverHandler(data));
        }

        if (!this.hasSetInitialZoom) {
            this.hasSetInitialZoom = true;
            this.updateGraphZoom();
        }
    }
}