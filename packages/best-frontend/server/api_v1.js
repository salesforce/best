/* eslint-env node */
const apicache = require('apicache');
const memoize = require('memoizee');
const crypto = require('crypto');
const gitIntegration = require("@best/github-integration");

const cache = apicache.middleware;
const onlyStatus200 = (req, res) => res.statusCode === 0;
const cacheSuccesses = cache('2 minutes', onlyStatus200);

// -- Globals configs ---------------------

const GIT_ORG = process.env.GIT_ORG;
const GIT_PROJECTS = process.env.GIT_PROJECTS || '{}';
let GIT_ORG_API;
let PROJECTS = {};

const memoizeConfig = { promise: true };
let memoizedGetBenchPerCommit;

// -- Internal APIs ------------------------

async function getOrganizationInstallation(org) {
    const APP = gitIntegration.createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data.find((i) => i.account.login === org);
    const installationId = repoInstallation.id;
    const owner = repoInstallation.account.login;
    const gitOrgApi = await APP.authAsInstallation(installationId);
    return gitOrgApi;
}

function initialize(store) {
    if (GIT_ORG) {
        PROJECTS = JSON.parse(GIT_PROJECTS[0] === '\'' ? GIT_PROJECTS.slice(1, -1) : GIT_PROJECTS);
        getOrganizationInstallation(GIT_ORG).then((gitAPI) => {
            GIT_ORG_API = gitAPI;
        }, () => {
            console.log(`Unable to initialize Github API`);
        });
    }
    // Memoize calls when routers gets invoked
    memoizedGetBenchPerCommit = memoize(async (project, commit) =>
        Object.freeze(store.getAllBenchmarkStatsPerCommit(project, commit), memoizeConfig)
    );
}

function addRoutes(router, store) {
    initialize(store);
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
    const gitRepo = PROJECTS[projectName];
    let gitLastCommits = [];
    if (GIT_ORG_API && gitRepo) {
        const [owner, repo] = gitRepo.split('/');
        const { data } = await GIT_ORG_API.repos.getCommits({ owner, repo, per_page: size });
        gitLastCommits = data.map(c => c.sha.slice(0, 7));
    }

    const commits = await store.getCommits(projectName, branch);
    const lastCommits = gitLastCommits.length ? gitLastCommits.reverse().filter((i) => commits.indexOf(i) !== -1 ) : commits.slice(0, size);

    const lastCommitBenchmarks = await Promise.all(lastCommits.map(async (commit) => {
        let benchmarks = await memoizedGetBenchPerCommit(projectName, commit);
        return { commit, benchmarks };
    }));

    return lastCommitBenchmarks;
}

exports.addRoutes = addRoutes;
exports.getLastCommitStats = getLastCommitStats;
