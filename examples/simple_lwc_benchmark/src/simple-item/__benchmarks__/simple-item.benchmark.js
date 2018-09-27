import Ctor from 'simple-item';
import { createElement } from 'lwc';

benchmark('create_and_render', () => {
    let element;
    run(() => {
        element = createElement('simple-item', { is: Ctor });
        document.body.appendChild(element);
    });
    after(() => {
        return element && element.parentElement.removeChild(element);
    });
});
