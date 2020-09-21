import { LightningElement } from 'lwc';

import { store } from 'store/store';
import { fetchProjectsIfNeeded, fetchOrganizationsIfNeeded } from 'store/actions';

export default class App extends LightningElement {
    connectedCallback() {
        store.dispatch(fetchProjectsIfNeeded());
        store.dispatch(fetchOrganizationsIfNeeded());
    }
}
