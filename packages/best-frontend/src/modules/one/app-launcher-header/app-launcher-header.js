import { Element } from "engine";

export default class AppLauncherHeader extends Element {
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
