import { api, LightningElement } from 'lwc';

export default class ComparePanel extends LightningElement {
    @api selectedCommitBenchmarks;

    renderedCallback() {}

    get selectedCommits() {
        return this.selectedCommits.map(s => s.commit);
    }
}
