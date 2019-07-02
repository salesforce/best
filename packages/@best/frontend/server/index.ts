import express from 'express'
import compression from 'compression'
import * as path from 'path'
import { FrontendConfig } from '@best/types';

import api from './api'

// FRONTEND

export const Frontend = (config: FrontendConfig): express.Application => {
    // CONFIG

    const DIST_DIR = path.resolve(__dirname, '../dist/')

    // EXPRESS

    const app: express.Application = express()

    app.use(compression())

    // API

    app.use('/api/v1', api(config))

    // FRONTEND

    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(DIST_DIR))
        app.get('*', (req, res): void => res.sendFile(path.resolve(DIST_DIR, 'index.html')))
    }

    return app
}

// EXPORTS

export { buildStaticFrontend } from './static'