import {
    PROJECTS_RECEIVED,
    PROJECT_SELECTED,
    CLEAR_BENCHMARKS,
    BENCHMARKS_RECEIVED,
    VIEW_TIMING_CHANGED,
    VIEW_BENCHMARKS_CHANGED,
    VIEW_METRICS_CHANGED,
    VIEW_ZOOM_CHANGED,
    VIEW_COMPARISON_CHANGED,
    VIEW_RESET,
    COMMIT_INFO_RECEIVED
} from 'store/shared';

import * as api from 'store/api';
import * as transformer from 'store/transformer';

function normalizeCommit(commit) {
    return commit.slice(0, 7);
}

function shouldFetchProjects(state) {
    return !state.projects.items.length;
}

function projectsReceived(projects) {
    return { type: PROJECTS_RECEIVED, projects };
}

function fetchProjects() {
    return async (dispatch) => {
        const projects = await api.fetchProjects();
        dispatch(projectsReceived(projects));
    }
}

export function fetchProjectsIfNeeded() {
    return (dispatch, getState) => {
        if (shouldFetchProjects(getState())) {
            return dispatch(fetchProjects());
        }

        return Promise.resolve()
    };
}

function benchmarksReceived(snapshots, benchmarks) {
    return { type: BENCHMARKS_RECEIVED, snapshots, benchmarks };
}

function clearBenchmarks() {
    return { type: CLEAR_BENCHMARKS };
}

function fetchBenchmarks(project) {
    return async (dispatch, getState) => {
        const { timing } = getState().view;
        const snapshots = await api.fetchSnapshots(project, timing);
        const benchmarks = transformer.snapshotsToBenchmarks(snapshots);
        dispatch(benchmarksReceived(snapshots, benchmarks));
    };
}

function findSelectedProject({ projects }) {
    return projects.items.find(proj => proj.id === projects.selectedProjectId);
}

export function comparisonChanged(comparison) {
    return { type: VIEW_COMPARISON_CHANGED, comparison };
}

export function benchmarksChanged(benchmark) {
    return { type: VIEW_BENCHMARKS_CHANGED, benchmark };
}

export function metricsChanged(metric) {
    return { type: VIEW_METRICS_CHANGED, metric };
}

export function zoomChanged(zoom) {
    return { type: VIEW_ZOOM_CHANGED, zoom };
}

export function resetView() {
    return { type: VIEW_RESET };
}

export function timingChanged(timing) {
    return (dispatch, getState) => {
        dispatch(zoomChanged({}));
        dispatch({ type: VIEW_TIMING_CHANGED, timing });

        const selectedProject = findSelectedProject(getState());
        dispatch(clearBenchmarks());
        dispatch(fetchBenchmarks(selectedProject));
    }
}

function filterSnapshotsForCommits(benchmarkName, commits, state) {
    const snapshotsForCommit = state.benchmarks.snapshots.filter(snap => commits.includes(normalizeCommit(snap.commit)));
    const benchmark = transformer.snapshotsToBenchmarks(snapshotsForCommit).find(bench => bench.name === benchmarkName);

    return benchmark;
}

export function fetchComparison(benchmarkName, commits) {
    return (dispatch, getState) => {
        const results = filterSnapshotsForCommits(benchmarkName, commits, getState());
        dispatch(comparisonChanged({ results, commits, benchmarkName }))
    }
}

export function selectProject(project, shouldResetView) {
    return async (dispatch) => {
        dispatch(clearBenchmarks());
        
        if (shouldResetView) { dispatch(resetView()) }

        dispatch({ type: PROJECT_SELECTED, id: project.id });
        
        return dispatch(fetchBenchmarks(project));
    };
}

/*
 * COMMIT INFO
*/

function shouldFetchCommitInfo(state, commit) {
    return !state.commitInfo.hasOwnProperty(normalizeCommit(commit));
}

function commitInfoReceived(commit, commitInfo) {
    return { type: COMMIT_INFO_RECEIVED, commit: normalizeCommit(commit), commitInfo };
}

function fetchCommitInfo(commit) {
    return async (dispatch) => {
        const commitInfo = await api.fetchCommitInfo(commit);
        dispatch(commitInfoReceived(commit, commitInfo));
    }
}

export function fetchCommitInfoIfNeeded(commit) {
    return (dispatch, getState) => {
        if (shouldFetchCommitInfo(getState(), commit)) {
            return dispatch(fetchCommitInfo(commit));
        }

        return Promise.resolve()
    }
}