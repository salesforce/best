/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

const BEST_SERVICE_TYPE = process.env.BEST_SERVICE_TYPE;

if (BEST_SERVICE_TYPE === 'hub') {
    console.log('Initializing Hub');
    require('@best/agent-hub').run();
} else if (BEST_SERVICE_TYPE === 'agent') {
    console.log('Initializing Agent');
    require('@best/agent').run();
} else if (BEST_SERVICE_TYPE === 'frontend') {
    if (!process.env.DATABASE_URL) {
        console.log('Unable to instanciate Best Frontend: You must provide DATABASE_URL');
        return;
    }

    const feConfig = {
        apiDatabase: {
            adapter: 'sql/postgres',
            uri: process.env.DATABASE_URL,
        },
        githubConfig: {
            owner: process.env.GITHUB_OWNER,
            repo: process.env.GITHUB_REPO,
        },
    };

    const PORT = process.env.PORT || 3000;
    const app = require('express')();
    app.use(require('@best/frontend').Frontend(feConfig));

    app.listen(PORT, () => {
        console.log(`Best Frontend listening on port: ${PORT}`);
    });
} else {
    console.log('Invalid Best Service Type. Values: [hub, agent, frontend]');
}
