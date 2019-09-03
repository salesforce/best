---
title: Getting Started
---

# Getting Started
Now that you have an [understanding of Best](/guide/introduction), it's time to start writing some benchmarks!

## Installation
First things first, install the Best CLI so that you can run your benchmarks.
```sh
yarn add @best/cli -D
```
This installs the `@best/cli` package in your `devDependencies`. This gives you access to the `best` command line tool inside your project.

## Writing Benchmarks
Now that you have Best installed you can start writing some benchmarks. It is recommended to place these in a `__benchmarks__` directory next to your unit tests.

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

This is a very simple example of what a benchmark might look like. Now let's look at one that uses [Lightning Web Components](https://lwc.dev) that interacts with the DOM.

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

Here we have also added an `after` block to clean up the DOM after our test. This ensures we are resetting the state properly between each benchmark.

This pattern should be very familiar to you: it is very similar to popular unit testing libraries. Additionally, these benchmarks are very easy to read and understand allowing any developer on your team to write them.

It is recommended to benchmark as much of your code as possible, just like unit testing, so that you do not get caught off guard and make a change that negatively effects your code's performance.

## Best Configuration File
There is one last step before you can run the benchmarks: create a `best.config.js` file in your project's root directory. At the very minimum you have to supply a project name but you can also specify different runners or plugins you would like Best to use.

```js
module.exports = {
    projectName: 'my-benchmarks'
}
```

To further customize your Best setup read about [configuration](/guide/configuration#best-configuration).

## Running Benchmarks Locally
By default Best uses Runner Headless ([Chrome from Puppeteer](https://github.com/GoogleChrome/puppeteer)). Install that:

```sh
yarn add @best/runner-headless -D
```

Now that you have all of the dependencies in place, you can run Best.

To run Best on your local machine, invoke the `best` command:
```sh
yarn best
```
This will load your `best.config.js`, find all of your benchmarks, build the artifacts, run them, and analyze the results.

[![asciicast](https://asciinema.org/a/158780.png)](https://asciinema.org/a/158780)

While running Best locally is a great start, read about [running Best remotely](/guide/running-remotely) to get the most out of Best.

If you want know more about the Best CLI check out the [Command Line Arguments](/guide/configuration#command-line-argumemnts) section.

## Benchmark Callbacks
You can use the following callbacks in your benchmarks for setup and cleanup.

### `beforeAll`
This runs before all of the benchmarks in a file.

### `before`
This runs before each benchmark.

### `after`
This runs after each benchmark.

### `afterAll`
This runs after all of the benchmarks in a file.
