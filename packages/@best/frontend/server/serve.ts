import express from 'express';
import { Frontend } from './index'
import config from './best-fe.config'

/*
 * NOTE:
 * THIS FILE IS FOR DEVELOPMENT TESTING ONLY
*/

const PORT = process.env.PORT || 3000

const app = express()

app.use(Frontend(config))

// LISTEN

app.listen(PORT, (): void => {
    // eslint-disable-next-line no-console
    console.log('[%s] API Listening on http://localhost:%d', app.settings.env, PORT)
})