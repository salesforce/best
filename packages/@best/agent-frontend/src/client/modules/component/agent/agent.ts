import { LightningElement, api } from 'lwc';

export default class ComponentAgent extends LightningElement {
    @api jobs = [];
    @api name = '';
}
