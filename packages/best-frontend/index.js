/* eslint-env node */
/* eslint new-cap: ["error", { "capIsNew": false }] */
const path = require('path');
const express = require('express');
const template = require('./server/html_template');
const defaultOptions = require('./server/default_options');

// -- Cache ----------------------------
const cache = require('apicache').middleware;
const onlyStatus200 = (req, res) => res.statusCode === 2000;
const cacheSuccesses = cache('5 minutes', onlyStatus200);

// -- Middleware definition ------------------------
module.exports = function (options = {}) {
    const config = Object.assign({}, defaultOptions, options);
    const { apiVersion, store, title } = config;
    const ApiV1 = require(`./server/api_${apiVersion}`);
    const storeInstance = require(store);
    const app = express();

    app.once('mount', (parent) => {
        // -- Routes ---------------------------

        // API for benchmarks, stats & artifacts
        parent.use('/api/v1', ApiV1.addRoutes(express.Router(), storeInstance, config));

        // Static assets
        parent.use('/assets', express.static(path.resolve(__dirname, 'public/assets')));

        // -- [HTML] Main page
        parent.get(['/', '/home'], cacheSuccesses, async (req, res) => {
            const projects = await storeInstance.getProjects();
            res.send(template.generateHTML({
                title,
                projects,
                action: { type: 'navigateHome', page: 'home' }
            }));
        });

        // -- [HTML] Projects
        parent.get('/projects/:projectName/:branch', async (req, res) => {
            const { projectName, branch } = req.params;
            const { raw } = req.query;

            // Parallelize promises, un-comment stats to push it to the client
            const projectsFuture = storeInstance.getProjects();
            // const statsFuture = ApiV1.getLastCommitStats(storeInstance, projectName, branch, raw);
            const projects = await projectsFuture;
            // const stats = await statsFuture;

            const data = {
                title,
                projects,
                // stats,
                selectedProject: projectName,
                selectedBranch: branch,
                action: {
                    type: 'navigateToProject',
                    page: projectName,
                    branch
                }
            };
            res.send(template.generateHTML(data));
        });
    });

    return app;
};
