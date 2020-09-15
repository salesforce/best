import { LightningElement, track, wire } from 'lwc';

import { connectStore, store } from 'store/store';
import { selectProject, selectOrganization } from 'store/actions';

export default class ViewSidebar extends LightningElement {
    @track Organization = [];
    @track projects = [];
    @track selectedId;

    hasSelectedInitialProject = false;

    @wire(connectStore, { store })
    storeChange({ projects }) {
        this.selectedId = projects.selectedProjectId;

        this.projects = projects.items.map(item => ({
            ...item,
            classes: item.id === projects.selectedProjectId ? 'item selected' : 'item'
        }));
    }

    renderedCallback() {
        if (!this.hasSelectedInitialProject && this.projects.length) {
            this.hasSelectedInitialProject = true;
            if (this.selectedId) { // from URL
                const project = this.projects.find(proj => proj.id === this.selectedId);
                store.dispatch(selectProject(project, false));
            } else {
                const firstProject = this.projects[0];
                store.dispatch(selectProject(firstProject, true));
            }
        }
    }

    selectOrganization(event) {
        const organizationId = parseInt(event.target.dataset.id,10);
        const organization = this.organizations.find(org => org.id === organizationId);
        if (organization) {
            store.disptach(selectOrganization(organization, true));
        }
    }
    
    selectProject(event) {
        const projectId = parseInt(event.target.dataset.id, 10);
        const project = this.projects.find(proj => proj.id === projectId);
        if (project) {
            store.dispatch(selectProject(project, true));
        }
    }
}