const API_VERSION = 'v1';

function createURL(path) {
    const base = window.location.protocol + '//' + window.location.host;
    return `${base}/api/${API_VERSION}/${path}`;
}

function timeQuery(project, timing) {
    if (timing === 'last-release' && project.lastReleaseDate) {
        return `since=${project.lastReleaseDate}`;
    } else if (timing === '2-months') {
        let date = new Date();
        date.setMonth(date.getMonth() - 2);
        return `since=${date.toISOString()}`
    }

    return ''
}

export async function fetchProjects() {
    const response = await fetch(createURL('projects'));
    const { projects } = await response.json();
    return projects
}

export async function fetchSnapshots(project, timing) {
    const timeParams = timeQuery(project, timing);
    const response = await fetch(createURL(`${project.id}/snapshots?${timeParams}`));
    const { snapshots } = await response.json();
    return snapshots;
}