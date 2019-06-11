import { LightningElement, api, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
// import { timingChanged, benchmarksChanged, metricsChanged } from 'store/actions';

export default class ComponentCommitInfo extends LightningElement {
    @api commit;

    @track commitInfo = {};

    @wire(connectStore, { store })
    storeChanged({ commitInfo }) {
        
    }

    get hasCommitInfo() {
        return Object.keys(this.commitInfo).length > 0;
    }

    connectedCallback() {
        console.log('find commit info for', this.commit);
        // kick off action to request commit info from github
    }
}