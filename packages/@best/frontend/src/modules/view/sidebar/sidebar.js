import { LightningElement, track, wire } from 'lwc';

import { ConnectStore, store } from 'store/store';
import { selectProject } from 'store/actions';

export default class ViewSidebar extends LightningElement {
    @track projects = [];
    @track selectedId;

    hasSelectedInitialProject = false;

    // eslint-disable-next-line @lwc/lwc/no-unknown-wire-adapters
    @wire(ConnectStore, { store })
    storeChange({ projects }) {
        this.selectedId = projects.selectedProjectId;

        this.projects = projects.items.map((item) => ({
            ...item,
            classes: item.id === projects.selectedProjectId ? 'item selected' : 'item',
        }));
    }

    renderedCallback() {
        if (!this.hasSelectedInitialProject && this.projects.length) {
            this.hasSelectedInitialProject = true;
            if (this.selectedId) {
                // from URL
                const project = this.projects.find((proj) => proj.id === this.selectedId);
                store.dispatch(selectProject(project, false));
            } else {
                const firstProject = this.projects[0];
                store.dispatch(selectProject(firstProject, true));
            }
        }
    }

    selectProject(event) {
        const projectId = parseInt(event.target.dataset.id, 10);
        const project = this.projects.find((proj) => proj.id === projectId);
        if (project) {
            store.dispatch(selectProject(project, true));
        }
    }
}
