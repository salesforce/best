import { createElement } from 'lwc';
import SimpleItem from 'simple/item';

describe('simple-item', () => {
    benchmark('create_and_render', () => {
        let element;
        run(() => {
            element = createElement('simple-item', { is: SimpleItem });
            document.body.appendChild(element);
        });
        after(() => {
            return element && element.parentElement.removeChild(element);
        });
    });    
})