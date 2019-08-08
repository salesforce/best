---
title: Frontend
---

# Best Frontend
The Best Frontend provides a powerful tool to view the performance of your code. With the frontend you can view all your projects and benchmarks in one place.

![Shows the Best Frontend](/assets/images/frontend_example.png)

Check out the [live demo](#) to see a frontend showing Best's own examples.

::: note
In order for the frontend to work, you need to [configure](#configuring-apidatabase) your `best.config.js` to properly use a hosted api database to store the result summaries.
:::

## Heroku Installation
The easiest way to get the frontend up and running is by clicking the button below to create a Heroku deployment that will serve your frontend.

[![Deploy Best Frontend](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/salesforce/best-heroku-deploy/tree/frontend)

## Manual Installation
If you want to install the frontend yourself, you can do that by creating your own server that will host the frontend. We strongly recommend following [this template](https://github.com/salesforce/best-heroku-deploy/tree/frontend) which contains everything you will need to get a frontend up and running.

However if you want to manage everything yourself, that is also possible if you follow the steps below.

In order to install the frontend simply add the package:
```sh
yarn add @best/frontend
```

The next thing you will need to do is create a file like `serve.js` that actually creates the server:
```js
import express from 'express';
import { Frontend } from '@best/frontend'
import config from './best-frontend.config'

const PORT = process.env.PORT || 3000

const app = express()

app.use(Frontend(config))

app.listen(PORT)
```

There are two things of note here, one we are using [Express](https://github.com/expressjs/express) to act as the actual webserver. Additionally, we have to provide a config to the frontend. The config file should be something like this:
```js
export default {
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: 'postgresql://localhost' // You should provide the connection URI to your hosted postgres database
    },
    githubConfig: { // (optional) this allows the frontend to fetch commit info directly from GitHub
        owner: 'salesforce',
        repo: 'best'
    }
}
```

Now all you need to do is start the server and you should be good to go.

If you want to enable the GitHub integration, please follow [our guide](/guide/github-integration) to understand what is required.

## Configuring `apiDatabase`
In order for your results to be stored on a hosted database (which is required for the frontend to work) you need to setup the `apiDatabase` field in your `best.config.js` file. Alternatively, you can also pass configuration variables to the cli.

### Configuration File
The easiest way to configure Best to use your hosted database is by adding the following to your `best.config.js`:
```js
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: 'postgresql://localhost'
    },
}
```

### CLI Arguments
If you do not want to do this, you can also pass the following arguments to the cli command like so,
```sh
best --dbAdapter=sql/postgres --dbURI=postgresql://localhost
```
This will override any configuration you have in your `best.config.js` file.