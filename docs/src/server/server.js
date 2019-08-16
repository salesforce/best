/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const serveStatic = require('serve-static');
const { loggerMiddleware, errorLoggerMiddleware } = require('./utils/logger');
const watchMiddleware = require('./utils/watchMiddleware');
const cachePage = require('./utils/page-caching');

const { __PROD__, __WATCH__, SITE_CONFIG, DIST_DIR } = require('./config');
const { docs, blog, tutorial } = SITE_CONFIG;

module.exports.createApp = async function createApp() {
    const app = express();
    app.use(loggerMiddleware);

    // GZip all the responses.
    app.use(compression());

    if (__WATCH__) {
        await require('./utils/watch')(app);
    }

    // Match all the request to serve static assets
    const assetsConfig = { immutable: true, maxAge: 31536000 * 1000 };
    app.use('/assets/js', serveStatic(path.join(DIST_DIR, 'assets/js'), assetsConfig));
    app.use('/assets/css/prod', serveStatic(path.join(DIST_DIR, 'assets/css/prod'), assetsConfig));
    app.use(express.static(DIST_DIR));

    function sendFile(name, res) {
        // TODO: We should use streaming, but will be more work for the watcher
        res.send(fs.readFileSync(path.resolve(DIST_DIR, `${name}.html`), 'utf8'));
    }

    // -- Router ------------------------------------------------------------------
    const prod = __PROD__;
    const blog_prefix = 'blog_';
    const tutorial_prefix = 'tutorial_';

    // Home
    app.get(
        ['/', '/home'],
        [
            cachePage(['home'], DIST_DIR, { prod, alias: { '/': 'home' } }),
            watchMiddleware(__WATCH__),
            (req, res) => sendFile('home', res),
        ],
    );

    // Guide
    app.get('/guide/:page', [
        cachePage(docs.pages, DIST_DIR, { prod }),
        watchMiddleware(__WATCH__),
        (req, res) => sendFile(req.params.page, res),
    ]);

    // Blog (redirect to latests)
    app.get('/blog', (req, res) => res.redirect(`/blog/${blog.latest}`));

    // Blog Pages
    app.get('/blog/:page', [
        cachePage(blog.pages, DIST_DIR, { prod, prefix: blog_prefix }),
        watchMiddleware(__WATCH__),
        (req, res) => sendFile(`${blog_prefix}${req.params.page}`, res),
    ]);

    // 404 error handling
    app.use([
        cachePage(['notfound'], DIST_DIR, { prod }),
        watchMiddleware(__WATCH__),
        (req, res) => {
            res.status(404);
            sendFile('notfound', res);
        },
    ]);

    // 500 error handling
    app.use([
        cachePage(['notfound'], DIST_DIR, { prod }),
        watchMiddleware(__WATCH__),
        (error, req, res, next) => {
            res.status(500);
            sendFile('notfound', res);
            next();
        },
    ]);

    // Error middleware
    app.use(errorLoggerMiddleware);

    return app;
};
