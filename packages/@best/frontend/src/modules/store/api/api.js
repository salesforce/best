const API_VERSION = 'v1';

function createURL(path) {
    const base = window.location.protocol + '//' + window.location.host;
    return `${base}/api/${API_VERSION}/${path}`;
}

function timeQuery(project, timing) {
    if (timing === 'last-release' && project.lastReleaseDate) {
        const date = new Date(project.lastReleaseDate);
        return `since=${date.getTime()}`;
    } else if (timing === '2-months') {
        const date = new Date();
        date.setMonth(date.getMonth() - 2);
        return `since=${date.getTime()}`;
    }

    return '';
}

export async function fetchProjects() {
    const response = await fetch(createURL('projects'));
    const { projects } = await response.json();
    return projects || [];
}

export async function fetchSnapshots(project, timing) {
    const timeParams = timeQuery(project, timing);
    const response = await fetch(createURL(`${project.id}/snapshots?${timeParams}`));
    const { snapshots } = await response.json();
    return snapshots || [];
}

export async function fetchCommitInfo(commit) {
    const response = await fetch(createURL(`info/${commit}`));
    const { commit: info, error } = await response.json();
    return info || { error };
}
