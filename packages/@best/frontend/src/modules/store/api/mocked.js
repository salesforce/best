function getMocked() {
    // this is a placeholder that will get replaced with the mocked data when compiling locally
    // eslint-disable-next-line no-undef
    return INSERT_MOCKED_DATA;
}

export async function fetchProjects() {
    return getMocked().projects;
}

export async function fetchSnapshots(project, timing) {
    return getMocked().snapshots[project.id][timing];
}

export async function fetchCommitInfo() {
    return {
        reason: 'Not connected to server.',
    };
}
