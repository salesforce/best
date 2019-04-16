# Best

Delightful JavaScript performance benchmarking. It's like Jest but for benchmarking ;)

[![asciicast](https://asciinema.org/a/158780.png)](https://asciinema.org/a/158780)

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

Run example benchmarks:

```bash
yarn best
```

Run a specific example benchmark

```bash
yarn best --config examples/simple_benchmark/best.prod.config.js
```

Be delighted!

### Example benchmark test

You can find an example benchmark under `examples/simple_benchmark/src/simple-item/__benchmarks__`

```javascript
import Ctor from 'simple-item';
import { createElement } from 'engine';

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
```
