import Ctor from 'simple-benchmark';
import { createElement } from 'engine';
import { appendFile } from 'fs';

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

describe('benchmarking app2', () => {
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

// app-benchmarks.js
//     > benchmarking app
//         > create and render
//             jsTime:
//             layout:
//             duration:

// {
//     name: 'app-benchmark.js',
//     benchmarks: {
//         "benchmarking app": {
//             "create and render": {
//                 duration: 0
//                 layout: 0
//             }
//         },
//         "benchmarking app2": {
//             "create and render": {
//                 duration: 0
//                 layout: 0
//             }
//         }
//     }
// }

// {
//     name: 'app-benchmark.js',
//     benchmarks: {
//         "benchmarking app": {
//             "create and render": {
//                 duration: 0
//                 layout: 0
//             }
//         },
//         "benchmarking app2": {
//             "create and render": {
//                 duration: 0
//                 layout: 0
//             }
//         }
// }
