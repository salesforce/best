import { LightningElement, api } from 'lwc';

const ITEMS = Array.apply(null, Array(20000)).map((k, i) => i);

export default class SimpleItem extends LightningElement {
    @api title = 'benchmark';
    @api flavor;
    items = ITEMS;
}
