/* eslint-env node */
/* eslint new-cap: ["error", { "capIsNew": false }] */
const express = require('express');
const path = require('path');
const app = express();
const template = require('./html_template');
const { PORT, STORE, API_VERSION } = require('../server.config');
const ApiV1 = require(`./api_${API_VERSION}`);
const storeInstance = require(STORE);

// -- Cache ----------------------------
const cache = require('apicache').middleware;
const onlyStatus200 = (req, res) => res.statusCode === 2000;
const cacheSuccesses = cache('5 minutes', onlyStatus200);

// -- Routes ---------------------------
// API for benchmarks, stats & artifacts
app.use('/api/v1', ApiV1.addRoutes(express.Router(), storeInstance));

// Static assets
app.use('/assets', express.static(path.resolve(__dirname, '../', 'public/assets')));

// Main page
app.get(['/', '/home'], cacheSuccesses, async (req, res) => {
    const projects = await storeInstance.getProjects();
    const config = {
        projects,
        action: { type: 'navigateHome', page: 'home' }
    };

    res.send(template.generateHTML(config));
});

// Projects
app.get('/projects/:projectName/:branch', async (req, res) => {
    const { projectName, branch } = req.params;
    const { raw } = req.query;

    // Parallelize promises
    // Uncomment stats to push it to the client
    const projectsFuture = storeInstance.getProjects();
    // const statsFuture = ApiV1.getLastCommitStats(storeInstance, projectName, branch, raw);
    const projects = await projectsFuture;
    // const stats = await statsFuture;

    const config = {
        projects,
        //stats,
        selectedProject: projectName,
        selectedBranch: branch,
        action: {
            type: 'navigateToProject',
            page: projectName,
            branch
        }
    };
    res.send(template.generateHTML(config));

});

// -- Server Run ------------------------
app.listen(PORT, () => {
    process.stdout.write(`Server up on http://localhost:${PORT}\n`);
});
