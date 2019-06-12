import { LightningElement, api, track, wire } from 'lwc';

export default class ComponentCommitInfo extends LightningElement {
    @api commit;
    @api top;
    @api left;

    @track commitInfo = {};

    get hasCommitInfo() {
        return Object.keys(this.commitInfo).length > 0;
    }

    get styleTag() {
        const style = `transform: translate(${this.left}px, ${this.top}px)`;
        console.log(style)
        return style;
    }

    close() {
        this.dispatchEvent(new CustomEvent('close', {
            detail: {
                commit: this.commit
            }
        }))
    }

    connectedCallback() {
        console.log('find commit info for', this.commit);
        // kick off action to request commit info from github

        // mocking for now...
        this.commitInfo = {
            fullCommit: '05d493ec074192bf9507084debb68060b5ab982d',
            username: 'pmdartus',
            profileImage: '',
            title: 'docs(style-compiler): update README (#1265)',
            body: `* docs(style-compiler): update README to reflect latest API`
        }
    }
}