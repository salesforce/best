import { Element, unwrap, track } from 'engine';
import INITIAL_STATE from './state';
import { reifyBranches, emulateFetch, initializeState, normalizeStats, updateURL} from './utils';

const { state: initState, action: initAction }  = initializeState(INITIAL_STATE, window.BEST);

export default class App extends Element {
    @track state = initState;
    constructor() {
        super();
        this.addEventListener('select', this.onItemSelect.bind(this));
        this.addEventListener('showitemmenu', this.onShowItemMenu.bind(this));
        addEventListener('popstate', ({ state : action }) => action && this.dispatchAction(action));
    }

    connectedCallback() {
        if (initAction) {
            this.dispatchAction(initAction, true);
        }
    }

    dispatchAction(action, replaceURL) {
        const { type, page, branch = "master" } = action;
        switch (type) {
            case 'navigateHome':
                this.state.selectedPage = page;
                this.state.pageType = 'home';
                updateURL(unwrap(action), '/home', replaceURL);
                break;

            case 'navigateToProject':
                this.state.selectedPage = page;
                this.state.pageType = 'project';
                updateURL(unwrap(action), `/projects/${page}/${branch}`);
                this.setProjectLastestStats(page, branch);
                break;

            default: break;
        }
    }

    async setProjectLastestStats(project, branch = "master") {
        const projectBranch = `${project}:${branch}`;
        if (!this.state.lastCommits[projectBranch]) {
            this.state.pageState = {};
            const response = await fetch(`/api/v1/projects/${project}/${branch}/lastcommits`);
            if (response.ok) {
                const stats = await response.json();
                normalizeStats(this.state, stats, project, branch);
            }
        }

        const commits = this.state.lastCommits[projectBranch];
        this.state.pageState = {
            projectBranch,
            commits,
            commitBenchmarks: commits.map(commit => ({
                commit,
                benchmarks: this.state.commits[projectBranch][commit]
            }))
        };
    }

    onItemSelect(event) {
        window.console.log('>> App - Select event Received!');
        const action = event.detail && (event.detail.action || event.target.action);
        if (action) {
            this.dispatchAction(action);
        }
    }

    async onShowItemMenu(event) {
        const entityApiName = event.detail.entityApiName;
        const dropdownItem = entityApiName && this.state.navItems.find(i => i.entityApiName === entityApiName);

        if (dropdownItem && !dropdownItem.dropdownMenu) {
            window.console.log('>> [Item selected] - Fetching dropdown menu: ', entityApiName);
            const branches = await emulateFetch(entityApiName);
            if (branches) {
                dropdownItem.dropdownMenu = reifyBranches(branches);
            } else {
                window.console.log('>> [Item selected] - callback: entityApiName not found');
            }

        }
    }
}
