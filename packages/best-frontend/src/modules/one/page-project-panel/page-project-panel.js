import { Element } from 'engine';

export default class ComparePanel extends Element {
    @api selectedCommitBenchmarks;

    renderedCallback() {}

    get selectedCommits() {
        return this.selectedCommits.map(s => s.commit);
    }
}
