import { LightningElement, track } from 'lwc';

const ITEMS = Array.apply(null, Array(1000)).map((k, i) => i);

export default class SimpleItem extends LightningElement {
    @track test = 'benchmark';
    items = ITEMS;
}
