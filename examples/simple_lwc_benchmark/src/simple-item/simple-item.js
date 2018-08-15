import { Element, track } from 'lwc';

const ITEMS = Array.apply(null, Array(1000)).map((k, i) => i);

export default class SimpleBench extends Element {
    @track test = 'benchmark';
    items = ITEMS;
}
