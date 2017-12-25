import Ctor from "simple-item";
import { createElement } from "engine";

describe('benchmark simple item', () => {
    benchmark('creation', () => {
        run(() => {
            const element = createElement('simple-item', { is: Ctor });
            document.body.appendChild(element);
        });
    });
});
