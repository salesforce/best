import { Element } from "engine";

const ITEMS = Array.apply(null, Array(4000)).map((k, i) => i);

export default class SimpleBench extends Element {
    @track test = 'benchnark';
    items = ITEMS;
}
