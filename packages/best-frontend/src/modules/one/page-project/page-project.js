import { api, track, LightningElement } from 'lwc';
import { normalizeForTrending, normalizeForComparison } from "./normalize-benchmarks";
import { generatePlot, cleanupPlots } from "./plots";

export default class HomePage extends LightningElement {
    @api projectId;
    @track benchmarksTrend;
    @track selectedCommits = [];

    _projectState;

    @api get projectState() {
        return this._projectState;
    }

    @api set projectState(newState) {
        const { commitBenchmarks } = newState;
        this._projectState = newState;
        this.benchmarksTrend = normalizeForTrending(commitBenchmarks);

        // TODO: remove me one we have the logic for clicking correct
        // if (commitBenchmarks && commitBenchmarks.length && this.benchmarksTrend && !this.selectedCommits.length) {
        //     this.selectedCommits.push({
        //         commit: newState.commits[newState.commits.length - 1],
        //         benchmarkName: Object.keys(this.benchmarksTrend)[0]
        //     });
        // }
    }

    get isDataReady() {
        return !!(this.benchmarksTrend && Object.keys(this.benchmarksTrend).length);
    }
    get benchmarks() {
        return Object.keys(this.benchmarksTrend);
    }

    get hasSelectedCommits() {
        return this.selectedCommits.length > 0;
    }

    get selectedCommitsBenchmarks() {
        const commitBenchmarks = this._projectState.commitBenchmarks;
        return commitBenchmarks.length
            ? this.selectedCommits.map(({ commit, benchmarkName }) => {
                const { benchmarks } = commitBenchmarks.filter((commitBench) => commitBench.commit === commit)[0];
                return {
                    commit,
                    benchmark: normalizeForComparison(benchmarks, benchmarkName)
                };
            })
            : {};
    }

    renderedCallback() {
        if (this.isDataReady) {
            cleanupPlots();
            const benchmarks = this.root.querySelectorAll('.benchmark');
            benchmarks.forEach(element => {
                const benchmarkName = element.dataset.id;
                generatePlot(element, benchmarkName, this.benchmarksTrend[benchmarkName]);
            });
        }
    }

    disconnectedCallback() {
        cleanupPlots();
    }
}
