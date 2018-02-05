/* eslint-env node */
const PROJECT_LIST = [
    'lwc-test',
    'lwc-best'
];

const BRANCH_LIST = [
    'master',
    '212/patch'
];

const COMMITS = {
    "lwc-test": {
        "master": [
            "0bf309c",
            "837dd91",
            "2bf309c",
            "2bf309e"
        ]
    },
    "lwc-best": {
        "master": []
    }
};

const BENCHMARK_STATS = {
    "lwc-test": {
        "0bf309c": ["append", "clear"],
        "837dd91": ["append", "clear"],
        "2bf309c": ["append", "clear"],
        "2bf309e": ["append", "clear"]
    }
};

module.exports.getVersion = function () {
    return "1.3";
};

module.exports.getProjects = async function () {
    console.log('[store-mocks] - getProjects');
    return PROJECT_LIST;
};

module.exports.getBranches = async function (projectName) {
    console.log(`[store-mocks] - getBranches(${projectName})`);
    return BRANCH_LIST;
};

module.exports.getCommits = async function (projectName, branch) {
    console.log(`[store-mocks] - getCommits(${projectName}, ${branch})`);
    return COMMITS[projectName][branch];
};

module.exports.getAllBenchmarkStatsPerCommit = async function (projectName, commit) {
    console.log(`[store-mocks] - getAllBenchmarkStatsPerCommit(${projectName}, ${commit})`);
    return BENCHMARK_STATS[projectName][commit].map((benchmarkName) => {
        return require(`./commit_${commit}_${benchmarkName}.json`);
    });
};

module.exports.getBenchmarkStatsPerCommit = async function (projectName, commit, benchmarkName) {
    console.log(`[store-mocks] - getBenchmarkStatsPerCommit(${projectName}, ${commit}, ${benchmarkName})`);
    return require(`./commit_${commit}_${benchmarkName}.json`);
};
