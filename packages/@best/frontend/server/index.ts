import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import * as path from 'path'

import api from './api'
import config from './best-fe.config'

// CONFIG

const PORT = process.env.PORT || 3000
const DIST_DIR = path.resolve(__dirname, '../dist/')

// EXPRESS

const app: express.Application = express()

app.use(helmet())
app.use(compression())

// API

app.use('/api/v1', api(config))

// FRONTEND

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(DIST_DIR))
    app.get('*', (req, res): void => res.sendFile(path.resolve(DIST_DIR, 'index.html')))
}

// LISTEN

app.listen(PORT, (): void => {
    // eslint-disable-next-line no-console
    console.log('[%s] API Listening on http://localhost:%d', app.settings.env, PORT)
})

// EXPORTS

export { buildStaticFrontend } from './static'