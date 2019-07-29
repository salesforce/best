---
title: Getting Started
---

# Getting Started
Now that you have a solid [understanding of Best](/guide/introduction), it's time to start writing some benchmarks!

## Installation
First things first, let's install the Best CLI so that you can run your benchmarks.
```sh
yarn add @best/cli -D
```
This will install the `@best/cli` package in your `devDependencies`. This will give you access to the `best` command line tool inside your project.

## Writing Benchmarks
Now that you have Best installed, you can start writing some benchmarks. We recommend placing these in a `__benchmarks__` directory right next to wherever you keep your unit tests.

Let's now look at some examples of what a benchmark might look like. Your benchmarks should be in a file ending in `.benchmark.js`.

```js
import fib from '../fib';

describe('js-execution', () => {
    benchmark('fibonacci 15', () => {
        run(() => {
            return fib(15);
        })
    })

    benchmark('fibonacci 38', () => {
        run(() => {
            return fib(38);
        })
    })
})
```

This is a very simple example of what a benchmark might look like, now let's look at one that uses [Lightning Web Components](https://lwc.dev) which interacts with the DOM.

```js
import { createElement } from 'lwc';
import SimpleItem from 'simple/item';

describe('simple-item', () => {
    benchmark('create_and_render', () => {
        let element;
        run(() => {
            element = createElement('simple-item', { is: SimpleItem });
            element.flavor = 'red';
            document.body.appendChild(element);
        })
        after(() => {
            return element && element.parentElement.removeChild(element);
        })
    })
})
```

Here we have also added an `after` block to clean up the DOM after our test. This ensures we are resetting the state properly in between each benchmark.

As you can see, this pattern should be very familiar to you as it is quite similar to popular unit testing libraries. Additionally, these benchmarks should be very easy to read and understand allowing any developer on your team to write them.

We highly encourage benchmarking as much of your code as possible, just like unit testing, so that you do not get caught off guard and make a change that can negatively effect your code's performance.

## Best Configuration File
There is one last step before we can actually run these benchmarks, we have to create a `best.config.js` file in your projects root directory. At the very minimum you have to supply a project name, but if you would like you can also specify different runners or plugins you would like Best to use.

```js
module.exports = {
    projectName: 'my-benchmarks'
}
```

If you want to further customize your Best setup, please read about [configuration](/guide/configuration#best-configuration).

## Running Benchmarks Locally
We have now finally come to the part in this guide where you get to run Best for yourself!

By default Best is going to use Runner Headless (Chrome from Puppeteer) so we also need to install that as well:
```sh
yarn add @best/runner-headless -D
```

Now that we have all of our dependencies in place, we can begin to run Best.

To run Best on your local machine, simply invoke the `best` command:
```sh
yarn best
```
This should find your `best.config.js` and then go and find all of your benchmarks, build the artifacts, run them, and then analyze the results.

[![asciicast](https://asciinema.org/a/158780.png)](https://asciinema.org/a/158780)

While running Best locally is a great start, please read on about [running Best remotely](/guide/running-remotely) to get the most out of Best.

Lastly, if you want know more about the Best CLI, you can check out the [Command Line Arguments](/guide/configuration#command-line-argumemnts) section in the configuration documentation.

## Benchmark Callbacks
You can introduce the following callbacks to your benchmarks to help with setup and cleanup.

### `beforeAll`
This runs before all of the benchmarks in a file.

### `before`
This will run before each benchmark you run.

### `after`
This will run after each benchmark you run.

### `afterAll`
This runs after all of the benchmarks in a file.
