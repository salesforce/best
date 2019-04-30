# How to set up `best`

1. Set the `npm` registry

   In order to be able to install `best`, you need to use
   the Salesforce `npm` registry, and that can be done by
   specifying it in the `.npmrc` file:

   ```sh
   echo 'registry=https://npm.lwcjs.org' >> .npmrc
   ```

1. Add the necessary dependencies

   e.g.:

   ```sh
   yarn add --dev best-cli @best/frontend @best/runner-headless
   ```

   or, if you use `npm`:

   ```sh
   npm install --save-dev best-cli @best/frontend @best/runner-headless
   ```

1. Make `best` available to `yarn` / `npm`

   Add a new script to your `package.json` file:

   e.g.:

   ```json
   {
       ...
       "scripts": {
          ...
          "perf": "best"
       },
       ...
   }
   ```

1. Configure `best`

   By default `best` will look for configurations in a file called
   `best.config.js`.

   If you want to name the configuration file something else, or
   have multiple ones, you can inform `best` which one should it
   use by passing the `--config` argument.

   e.g.:

   ```sh
   best --config my-custom-config.js
   ```

1. Create benchmarks

   * Create a directory called `__benchmarks__`, for example,
     under `tests/`.

   * Add your benchmarks in the `__benchmarks__` directory in
     files named `<name>.benchmark.js` that contain something
     such as:

    ```js
    benchmark('benchmark', () => {
        run(() => {
            // code to run
        });
    });
    ```

1. Run benchmarks

   Presuming the `npm` `best` related script from your `package.json`
   file is named `perf`:

    ```sh
    yarn perf
    ```

    or, if you use `npm`:

    ```sh
    npm run perf
    ```
