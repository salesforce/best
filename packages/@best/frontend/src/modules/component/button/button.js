import { LightningElement } from 'lwc';

export default class ComponentButton extends LightningElement {
    click() {
        this.dispatchEvent(new CustomEvent('click'))
    }
}