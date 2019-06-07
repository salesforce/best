import { LightningElement } from 'lwc';

import { store } from 'store/store';
import { fetchProjectsIfNeeded } from 'store/actions';

export default class App extends LightningElement {
    connectedCallback() {
        store.dispatch(fetchProjectsIfNeeded())
    }
}
