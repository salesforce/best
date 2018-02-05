/* eslint-env node */
const apicache = require('apicache');
const memoize = require('memoizee');
const crypto = require('crypto');

const cache = apicache.middleware;
const onlyStatus200 = (req, res) => res.statusCode === 0;
const cacheSuccesses = cache('2 minutes', onlyStatus200);
const memoizeConfig = { promise: true };

let memoizedGetBenchPerCommit;

function addRoutes(router, store) {
    // memoize calls when routers gets invoked
    memoizedGetBenchPerCommit = memoize(async (project, commit) =>
        Object.freeze(store.getAllBenchmarkStatsPerCommit(project, commit), memoizeConfig)
    );

    router.get('/cache/index', (req, res) => res.json(apicache.getIndex()));
    router.get('/cache/clear', (req, res) => res.json(apicache.clear()));

    // Get list of projects
    router.get('/projects', cacheSuccesses, async (req, res) => {
        console.log('[API] /projects');
        try {
            const result = await store.getProjects();
            res.json(result);
        } catch (e) {
            res.status(400).json({ message: 'Error retrieving projects'});
        }
    });

    // Get branches
    router.get('/projects/:projectName', cacheSuccesses, async (req, res) => {
        try {
            const projectName = req.params.projectName;
            const result = await store.getBranches(projectName);
            res.json(result);
        } catch (e) {
            res.status(400).json({ message: 'Error retrieving branches'});
        }
    });

    // Get Commits
    router.get('/projects/:projectName/:branch/commits', cacheSuccesses, async (req, res) => {
        try {
            const { projectName, branch } = req.params;
            const commits = await store.getCommits(projectName, branch);
            res.json(commits);
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: 'Error retrieving commits'});
        }
    });

    // Get Last commits summary
    router.get('/projects/:projectName/:branch/lastcommits', cacheSuccesses, async (req, res) => {
        try {
            const { projectName, branch } = req.params;
            const { raw } = req.query;
            const stats = await getLastCommitStats(store, projectName, branch, raw);
            res.json(stats);
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: 'Error retrieving commits'});
        }
    });

    // Get Benchmarks stats for a given commit
    router.get('/projects/:projectName/:branch/commits/:commit/benchmarks', cacheSuccesses, async (req, res) => {
        try {
            const { projectName, commit } = req.params;
            const benchmarksStats = await memoizedGetBenchPerCommit(projectName, commit);
            res.json(benchmarksStats);
        } catch (e) {
            res.status(400).json({ message: 'Error retrieving commits'});
        }
    });

    return router;
}

async function getLastCommitStats(store, projectName, branch, size = 30) {
    const commits = await store.getCommits(projectName, branch);
    const lastCommits = commits.slice(0, size);
    return Promise.all(lastCommits.map(async (commit) => {
        let benchmarks = await memoizedGetBenchPerCommit(projectName, commit);
        return { commit, benchmarks };
    }));
}

exports.addRoutes = addRoutes;
exports.getLastCommitStats = getLastCommitStats;
