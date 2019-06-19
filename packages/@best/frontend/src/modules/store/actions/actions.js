import {
    PROJECTS_RECEIVED,
    PROJECT_SELECTED,
    CLEAR_BENCHMARKS,
    BENCHMARKS_RECEIVED,
    VIEW_TIMING_CHANGED,
    VIEW_BENCHMARKS_CHANGED,
    VIEW_METRICS_CHANGED,
    VIEW_ZOOM_CHANGED,
    VIEW_RESET,
    COMMIT_INFO_RECEIVED
} from 'store/shared';

import * as api from 'store/api';
import * as transformer from 'store/transformer';

function shouldFetchProjects(state) {
    return !state.projects.length;
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
            dispatch(fetchProjects());
        }
    };
}

function benchmarksReceived(benchmarks) {
    return { type: BENCHMARKS_RECEIVED, benchmarks };
}

function clearBenchmarks() {
    return { type: CLEAR_BENCHMARKS };
}

function fetchBenchmarks(project) {
    return async (dispatch, getState) => {
        const { timing } = getState().view;
        const snapshots = await api.fetchSnapshots(project, timing);
        const benchmarks = transformer.snapshotsToBenchmarks(snapshots);
        dispatch(benchmarksReceived(benchmarks));
    };
}

function findSelectedProject({ projects }) {
    return projects.items.find(proj => proj.id === projects.selectedProjectId);
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

export function selectProject(project, shouldResetView) {
    return (dispatch) => {
        dispatch(clearBenchmarks());
        
        if (shouldResetView) { dispatch(resetView()) }

        dispatch(fetchBenchmarks(project));
        dispatch({ type: PROJECT_SELECTED, id: project.id });
    };
}