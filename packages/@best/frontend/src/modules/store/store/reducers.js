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
    COMMIT_INFO_RECEIVED,
} from 'store/shared';

export function projects(
    state = {
        items: [],
        selectedProjectId: undefined,
    },
    action,
) {
    switch (action.type) {
        case PROJECTS_RECEIVED:
            return {
                ...state,
                items: action.projects,
            };
        case PROJECT_SELECTED:
            return {
                ...state,
                selectedProjectId: action.id,
            };
        default:
            return state;
    }
}

export function benchmarks(
    state = {
        items: [],
        snapshots: [],
    },
    action,
) {
    switch (action.type) {
        case CLEAR_BENCHMARKS:
            return {
                items: [],
                snapshots: [],
            };
        case BENCHMARKS_RECEIVED:
            return {
                items: action.benchmarks,
                snapshots: action.snapshots,
            };
        default:
            return state;
    }
}

export function view(
    state = {
        timing: '2-months',
        benchmark: 'all',
        metric: 'all',
        zoom: {}, // this goes directly to/from plotly,
        comparison: { commits: [], results: {}, benchmarkName: null },
    },
    action,
) {
    switch (action.type) {
        case VIEW_TIMING_CHANGED:
            return {
                ...state,
                timing: action.timing,
            };
        case VIEW_BENCHMARKS_CHANGED:
            return {
                ...state,
                benchmark: action.benchmark,
            };
        case VIEW_METRICS_CHANGED:
            return {
                ...state,
                metric: action.metric,
            };
        case VIEW_ZOOM_CHANGED:
            return {
                ...state,
                zoom: action.zoom,
            };
        case VIEW_COMPARISON_CHANGED:
            return {
                ...state,
                comparison: action.comparison || { commits: [], results: {}, benchmarkName: null },
            };
        case VIEW_RESET:
            return view(undefined, {}); // returns default state
        default:
            return state;
    }
}

export function commitInfo(state = {}, action) {
    switch (action.type) {
        case COMMIT_INFO_RECEIVED:
            return {
                ...state,
                [action.commit]: action.commitInfo,
            };
        default:
            return state;
    }
}
