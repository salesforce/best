/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/* eslint-disable no-console */
const reloadLib = require('reload');
const watch = require('watch');
const buildDocumentation = require('../../../scripts/build-documentation');
const buildAssets = require('../../../scripts/build-assets');
const buildBlog = require('../../../scripts/build-blog');
const buildHome = require('../../../scripts/build-homepage');

async function watchDirectory(dir, opts = { interval: 1 }, onChange) {
    watch.watchTree(dir, opts, async (f, prev, curr) => {
        if (typeof f == 'object' && prev === null && curr === null) {
            console.log(`Watching for changes on ${dir}...`);
        } else if (prev === null) {
            // TODO: f is a new file
        } else if (curr.nlink === 0) {
            // TODO: f was removed
        } else {
            console.log(`[WATCHER] ${f} changed. Recompiling documentation...`);
            try {
                onChange(f);
            } catch (err) {
                console.log(`[WATCHER] ${f} changed. An error occurred compiling...`);
                console.log(err);
            }
        }
    });
}

module.exports = function watchDocChanges(app) {
    const opts = { interval: 1 };
    return reloadLib(app)
        .then(function ({ reload }) {
            const update = {
                assets: async () => {
                    await buildAssets();
                    reload();
                },
                home: async () => {
                    await buildHome();
                    reload();
                },
                docs: async () => {
                    await buildDocumentation();
                    reload();
                },
                blog: async () => {
                    await buildBlog();
                    reload();
                },
            };

            // Watch Asssets
            watchDirectory('src/client/assets', opts, update.assets);

            // Watch home
            watchDirectory('src/client', opts, update.home);

            // Watch Docs
            watchDirectory('content/docs', opts, update.docs);
            watchDirectory('src/client/modules', { ...opts, filter: (f) => !f.endsWith('tutorial') }, update.docs);

            // Watch blog
            watchDirectory('content/blog', opts, update.blog);
        })
        .catch(function (err) {
            console.error('Reload could not start, could not start server/sample app', err);
        });
};
