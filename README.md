# Best
Delightful JavaScript performance benchmarking.

## Getting Started

This is a work in progress. Feedback is welcome.

### Instructions to give it a run:

Install dependencies:

```bash
yarn install
```

Watch/build projects for development:

```bash
yarn watch
```

Go to the example repo:

```bash
cd examples/simple_benchmark/
```

Run the benchmark

```bash
npx best --interactions 3
```

Be delighted!

### Example benchmark test

You can find this example under `examples/simple_benchmark/src/simple-item/__benchmarks__`

```javascript
import Ctor from 'simple-item';
import { createElement } from 'engine';

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

```
