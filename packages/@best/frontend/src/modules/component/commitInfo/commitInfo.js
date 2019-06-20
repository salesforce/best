import { LightningElement, api, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { fetchCommitInfoIfNeeded } from 'store/actions';

export default class ComponentCommitInfo extends LightningElement {
    @api commit;
    @api top;
    @api left;

    @track commitInfo = {};

    @wire(connectStore, { store })
    storeChanged({ commitInfo }) {
        this.commitInfo = commitInfo[this.commit];
    }

    get hasError() {
        return this.commitInfo.hasOwnProperty('reason');
    }

    get hasCommitInfo() {
        return (this.commitInfo && Object.keys(this.commitInfo).length > 0);
    }

    get styleTag() {
        return `transform: translate(${this.left}px, ${this.top}px)`;
    }

    close() {
        this.dispatchEvent(new CustomEvent('close', {
            detail: {
                commit: this.commit
            }
        }))
    }

    renderedCallback() {
        if (!this.hasCommitInfo) {
            store.dispatch(fetchCommitInfoIfNeeded(this.commit));
        }
    }
}