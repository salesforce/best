import Ctor from "simple-benchmark";
import { createElement } from "engine";

describe('benchmarking app', () => {
    benchmark('create and render', () => {
        run(() => {
            const element = createElement('simple-benchmark', { is: Ctor });
            document.body.appendChild(element);
        });
    });
    afterAll(() => {
        // cleanup
        document.body.innerHTML = '';
    });
});
