/* eslint-env node */
const apicache = require('apicache');
const memoize = require('memoizee');
const crypto = require('crypto');
const gitIntegration = require("@best/github-integration");

const cache = apicache.middleware;
const onlyStatus200 = (req, res) => res.statusCode === 0;
const cacheSuccesses = cache('2 minutes', onlyStatus200);

// -- Globals configs ---------------------
const GIT_REPO = process.env.GIT_REPO;
let GIT_ORG_API;

const memoizeConfig = { promise: true };
let memoizedGetBenchPerCommit;

// -- Internal APIs ------------------------

async function getOrganizationInstallation(repo) {
    const org = repo.split('/')[0];
    const APP = gitIntegration.createGithubApp();
    const gitAppAuth = await APP.authAsApp();
    const installations = await gitAppAuth.apps.getInstallations({});
    const repoInstallation = installations.data.find((i) => i.account.login === org);
    const installationId = repoInstallation.id;
    const gitOrgApi = await APP.authAsInstallation(installationId);
    const repos = await gitOrgApi.apps.getInstallationRepositories();
    const activeRepo = repos.data.repositories.find((r) => r.full_name === repo);

    if (!activeRepo) {
        throw new Error(`Couldn't match git repository '${repo}'`);
    }

    return gitOrgApi;
}

function initialize(store, { githubConfig = {} }) {
    const repo = githubConfig.repo || GIT_REPO;
    if (repo) {
        getOrganizationInstallation(repo).then((gitAPI) => {
            GIT_ORG_API = gitAPI;
        }, (err) => {
            console.log(err);
            console.log(`Unable to initialize Github API`);
        });
    }

    // Memoize calls when routers gets invoked
    memoizedGetBenchPerCommit = memoize(async (project, commit) =>
        Object.freeze(store.getAllBenchmarkStatsPerCommit(project, commit), memoizeConfig)
    );
}

function addRoutes(router, store, config) {
    initialize(store, config);
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

async function getLatestsCommits(gitRepo, size, retried = false) {
    const [owner, repo] = gitRepo.split('/');
    try {
        console.log('[GIT] getCommits() >> FETCH');
        const { data } = await GIT_ORG_API.repos.getCommits({ owner, repo, per_page: size });
        return data;
    } catch(err) {
        console.log('[GIT] getCommits() >> RETRY');
        if (err.code === 401 && !retried) {
            GIT_ORG_API = await getOrganizationInstallation(GIT_ORG);
            return getLatestsCommits(gitRepo, size, true);
        }
        console.log('[GIT] getCommits() >> ERROR');
        throw err;
    }
}

async function getLastCommitStats(store, projectName, branch, size = 30) {
    let gitLastCommits = [];

    if (GIT_ORG_API) {
        const gitCommits = await getLatestsCommits(GIT_REPO, size);
        gitLastCommits = gitCommits.map(c => c.sha.slice(0, 7));
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
