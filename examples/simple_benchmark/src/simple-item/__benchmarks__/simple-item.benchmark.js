import Ctor from "simple-item";
import { createElement } from "engine";

describe('benchmarking simple item', () => {
    benchmark('create and render', () => {
        run(() => {
            const element = createElement('simple-item', { is: Ctor });
            document.body.appendChild(element);
        });
    });
    afterAll(() => {
        // cleanup
        document.body.innerHTML = '';
    });
});
