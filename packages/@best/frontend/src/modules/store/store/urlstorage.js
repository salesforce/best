import queryString from 'query-string';

const DEBOUNCE_DURATION = 500;

function debounce(fn, duration) {
    let timer;
    return function(...args) {
        const thisValue = this;

        if (timer) {
            clearTimeout(timer);
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        timer = setTimeout(() => {
            fn.apply(thisValue, args);
            timer = null;
        }, duration);
    };
}

function updateProjectsPathIfNeeded(projectId) {
    const newPath = `/${projectId}`;

    if (window.location.pathname !== newPath) {
        window.history.pushState(null, null, newPath)
    }
}

function friendlyZoom(zoom) {
    if (zoom.hasOwnProperty('xaxis.range')) {
        return zoom['xaxis.range'];
    } else if (zoom.hasOwnProperty('xaxis.range[0]')) {
        return [zoom['xaxis.range[0]'], zoom['xaxis.range[1]']];
    }

    return 'auto';
}

function loadProjectFromPath() {
    const path = window.location.pathname;
    const projectId = path.replace(/\D/g, '');
    return projectId;
}

function updateViewQueryIfNeeded(view) {
    const friendlyView = {
        ...view,
        zoom: friendlyZoom(view.zoom),
        comparison: view.comparison.commits
    }

    if (view.comparison.benchmarkName) {
        friendlyView.comparisonBenchmark = view.comparison.benchmarkName;
    }
    
    const newQuery = queryString.stringify(friendlyView, { arrayFormat: 'comma' });

    if (window.location.hash !== `#${newQuery}`) {
        window.location.hash = newQuery;
    }
}

function loadFriendlyZoom(zoomQuery) {
    if (typeof zoomQuery === 'string' && zoomQuery === 'auto') {
        return {
            'xaxis.autorange': true
        };
    } else if (zoomQuery.length > 1) {
        return {
            'xaxis.range': zoomQuery
        }
    }

    return {};
}

function loadViewFromQuery() {
    const hash = window.location.hash;
    if (hash.length > 0) {
        const query = hash.slice(1);
        const parsedQuery = queryString.parse(query, { arrayFormat: 'comma' });

        // TODO: ensure this is not going to be an issue for security
        const view = {
            benchmark: parsedQuery.benchmark,
            timing: parsedQuery.timing,
            metric: parsedQuery.metric,
            zoom: loadFriendlyZoom(parsedQuery.zoom),
            comparison: { commits: parsedQuery.comparison || [], results: {}, benchmarkName: parsedQuery.comparisonBenchmark }
        }

        return view;
    }

    return {};
}

export const loadState = () => {
    let state = {};

    const projectId = loadProjectFromPath();
    const view = loadViewFromQuery();

    if (projectId.length > 0) {
        state = {
            ...state,
            projects: {
                items: [],
                selectedProjectId: parseInt(projectId, 10)
            }
        }
    }

    if (view) {
        state = {
            ...state,
            view
        }
    }

    return state;
}

const saveState = ({ projects: { selectedProjectId }, view }) => {
    try {
        updateProjectsPathIfNeeded(selectedProjectId);
    } catch (err) {
        // log error or something
    }
    updateViewQueryIfNeeded(view);
}

const debouncedSave = debounce(saveState, DEBOUNCE_DURATION);

export const middleware = store => next => action => {
    next(action);
    debouncedSave(store.getState());
};
