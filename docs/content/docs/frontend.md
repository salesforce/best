---
title: Frontend
---

# Best Frontend
The Best Frontend provides a powerful tool to view the performance of your code. With the frontend you can view all your projects and benchmarks in one place.

![Shows the Best Frontend](/assets/images/frontend_example.png)

Check out the [live demo](#) to see a frontend showing Best's own examples.

::: note
In order for the frontend to work you must [configure](#configuring-apidatabase) your `best.config.js` to use a hosted API database to store the result summaries.
:::

## Heroku Installation
The easiest way to get the frontend up and running is by clicking the button below to create a Heroku deployment that serve the frontend.

[![Deploy Best Frontend](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/frontend)

## Manual Installation
You can create your own server to host the frontend. It is recommended to follow [this template](https://github.com/salesforce/best-heroku-deploy/tree/frontend) and the steps below.

Install the frontend by adding its package.
```sh
yarn add @best/frontend
```

Create a file like `serve.js` that creates the HTTP server:
```js
import express from 'express';
import { Frontend } from '@best/frontend'
import config from './best-frontend.config'

const PORT = process.env.PORT || 3000

const app = express()

app.use(Frontend(config))

app.listen(PORT)
```

This example uses [Express](https://github.com/expressjs/express) as the webserver. The configuration file `best-frontend.confg` contains the following.
```js
export default {
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: 'postgresql://localhost' // Provide the connection URI to your hosted postgres database
    },
    githubConfig: { // (optional) Allows the frontend to fetch commit info directly from GitHub
        owner: 'salesforce',
        repo: 'best'
    }
}
```

Start the server and point your browser as its URL.

To enable the GitHub integration in the frontend follow the [Github integration guide](/guide/github-integration).

## Configuring `apiDatabase`
To store your results in a hosted database (which is required for the frontend to work) you must set the `apiDatabase` field in your `best.config.js` file or pass command line arguments

### Configuration File
Specify the hosted API database by adding the following to your `best.config.js`.
```js
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: 'postgresql://localhost'
    },
}
```

### CLI Arguments
If the configuration file approach is not suitable for your environment then specify the following command-line arguments.
```sh
best --dbAdapter=sql/postgres --dbURI=postgresql://localhost
```
This overrides the configuration in `best.config.js`.