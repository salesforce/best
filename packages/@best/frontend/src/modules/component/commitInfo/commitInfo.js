import { LightningElement, api, track, wire } from 'lwc';

import { ConnectStore, store } from 'store/store';
import { fetchCommitInfoIfNeeded } from 'store/actions';

export default class ComponentCommitInfo extends LightningElement {
    @api commit;
    @api top;
    @api left;
    @api hidden;
    @api pendingcompare;

    @track commitInfo = {};

    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(ConnectStore, { store })
    storeChanged({ commitInfo }) {
        this.commitInfo = commitInfo[this.commit];
    }

    get hasError() {
        return Object.prototype.hasOwnProperty.call(this.commitInfo, "error");
    }

    get hasCommitInfo() {
        return this.commitInfo && Object.keys(this.commitInfo).length > 0;
    }

    get styleTag() {
        return `transform: translate(${this.left}px, ${this.top}px)`;
    }

    get classNames() {
        return this.hidden ? 'hidden commit-info' : 'commit-info';
    }

    get compareButtonText() {
        return this.pendingcompare ? 'Uncompare' : 'Compare';
    }

    close() {
        this.dispatchEvent(
            new CustomEvent('close', {
                detail: {
                    commit: this.commit,
                },
            }),
        );
    }

    compare() {
        this.dispatchEvent(
            new CustomEvent('compare', {
                detail: {
                    commit: this.commit,
                },
            }),
        );
    }

    connectedCallback() {
        if (!this.hasCommitInfo) {
            store.dispatch(fetchCommitInfoIfNeeded(this.commit));
        }
    }
}
