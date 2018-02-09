/* eslint no-shadow: ["error", { "allow": ["state"] }] */
function buildSeparator(label) {
    return {
        label,
        role: 'separator',
        separator: true,
        'className': 'slds-dropdown__header slds-text-title--caps'
    };
}
function buildBranch(action, section) {
    return {
        action,
        section,
        label: action.label,
        'class': 'slds-dropdown__item'
    };
}

export function reifyBranches(branches) {
    // Items
    const items = [];
    if (branches && branches.length) {
        items.push(buildSeparator('Branches'));
        items.push.apply(items, branches.map(m => buildBranch({
            label: m,
        }, 'branch')));
    }

    return items;
}

export function emulateFetch(entityApiName) {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line lwc/no-set-timeout
        setTimeout(() => {
            resolve(['master', '214/patch']);
        }, 300);
    });
}

function buildNavItem(name, hasBranches) {
    return {
        "label": name,
        "route": `/project/${name}`,
        "entityApiName" :name,
        showMenu: hasBranches,
        "navAction": {
            type: "navigateToProject",
            page: name
        },
        "id": name
    };
}

export function normalizeStats(state, stats, project, branch) {
    const projectBranch = `${project}:${branch}`;
    const commits = [];
    stats.forEach(({ commit, benchmarks }) => {
        commits.push(commit);
        state.commits[projectBranch][commit] = benchmarks;
    });
    state.lastCommits[projectBranch] = commits;
}

export function initializeState(state, serverState) {
    const { action, stats, projects, branches, selectedProject, selectedBranch} = serverState;
    const navItems = projects.map(p => buildNavItem(p));
    state.projects = projects;
    // eslint-disable-next-line no-return-assign, no-sequences
    state.branches = projects.reduce((r, p) => (r[p] = ['master'], r), {});
    projects.reduce((state, p) => {
        state.branches[p].forEach((b) => {
            const projectBranch = `${p}:${b}`;
            state.lastCommits[projectBranch] = null;
            state.commits[projectBranch] = {};
        });
        return state;
    }, state);

    state.navItems.push(...navItems);

    if (stats) {
        normalizeStats(state, stats, selectedProject, selectedBranch);
    }

    return { action, state };
}


export function updateURL(action, url, replaceURL) {
    if (!location.toString().endsWith(url)) {
        if (replaceURL) {
            history.replaceState(action, '', url);
        } else {
            history.pushState(action, '', url);
        }
    }
}
