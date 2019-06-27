import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { selectProject } from 'store/actions';

export default class ViewSidebar extends LightningElement {

    @track projects = [];
    @track selectedId;

    hasFetchedInitialProject = false;

    @wire(connectStore, { store })
    storeChange({ projects }) {
        this.selectedId = projects.selectedProjectId;
        this.needsLoadingFromURL = projects.needsLoadingFromURL;

        this.projects = projects.items.map(item => ({
            ...item,
            classes: item.id === projects.selectedProjectId ? 'item selected' : 'item'
        }));
    }

    renderedCallback() {
        if (!this.hasFetchedInitialProject && this.projects.length) {
            this.hasFetchedInitialProject = true;
            if (this.selectedId) { // from URL
                const project = this.projects.find(proj => proj.id === this.selectedId);
                store.dispatch(selectProject(project, false));
            } else {
                const firstProject = this.projects[0];
                store.dispatch(selectProject(firstProject, true));
            }
        }
    }

    selectProject(event) {
        const projectId = parseInt(event.target.dataset.id, 10);
        const project = this.projects.find(proj => proj.id === projectId);
        if (project) {
            store.dispatch(selectProject(project, true));
        } else {
            console.error('error', this.projects, projectId, project);
        }
    }
}