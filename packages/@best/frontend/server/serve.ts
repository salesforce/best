/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import express from 'express';
import { Frontend } from './index';
import config from './best-fe.config';

/*
 * NOTE:
 * THIS FILE IS FOR DEVELOPMENT TESTING ONLY
 */

const PORT = process.env.PORT || 3000;

const app = express();

app.use(Frontend(config));

// LISTEN

app.listen(PORT, (): void => {
    // eslint-disable-next-line no-console
    console.log('[%s] API Listening on http://localhost:%d', app.settings.env, PORT);
});
