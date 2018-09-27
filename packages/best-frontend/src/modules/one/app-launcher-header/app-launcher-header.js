import { LightningElement } from 'lwc';

export default class AppLauncherHeader extends LightningElement {
    constructor() {
        super();
        this.addEventListener('click', this.handleClick);
    }

    connectedCallback() {
        this.classList.add('slds-icon-waffle_container');
    }

    handleClick() {
        console.log('app-launcher:click');
    }
}
