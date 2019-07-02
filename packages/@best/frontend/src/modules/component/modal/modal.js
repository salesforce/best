import { LightningElement, api } from 'lwc';

export default class ComponentModal extends LightningElement {
    @api title;

    close() {
        this.dispatchEvent(new CustomEvent('close'))
    }
}