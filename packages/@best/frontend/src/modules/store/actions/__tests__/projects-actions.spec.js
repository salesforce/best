import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';

import * as types from 'store/shared';
import * as actions from 'store/actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockFetchProjects = () => {
    const response = [
        {
            id: 1,
            name: 'foo',
        },
        {
            id: 2,
            name: 'bar',
        },
    ];

    fetchMock.getOnce(/projects/, {
        body: { projects: response },
        headers: { 'content-type': 'application/json' },
    });

    const expectedAction = {
        type: types.PROJECTS_RECEIVED,
        projects: response,
    };

    return { expectedAction, response };
};

const mockSelectProject = () => {
    const projectId = 1;

    const projects = {
        items: [
            {
                id: projectId,
                name: 'Hello',
            },
        ],
        selectedProjectId: undefined,
    };

    const response = [
        {
            id: 1,
            projectId,
            name: 'bench-1',
            commit: 'aaaaaaa',
            commitDate: '2019-06-21 17:23:24',
            metrics: [{ name: 'metric-a', duration: 5, stdDeviation: 1 }],
            environmentHash: 'asdf',
            similarityHash: 'asdf',
        },
    ];

    const transformedResponse = [
        {
            commitDates: ['June 21'],
            commits: ['aaaaaaa'],
            environmentHashes: ['asdf'],
            similarityHashes: ['asdf'],
            metrics: [{ name: 'metric-a', durations: [5], stdDeviations: [1] }],
            name: 'bench-1',
        },
    ];

    fetchMock.getOnce(/snapshots/, {
        body: { snapshots: response },
        headers: { 'content-type': 'application/json' },
    });

    const benchmarksReceived = {
        type: types.BENCHMARKS_RECEIVED,
        snapshots: response,
        benchmarks: transformedResponse,
    };

    const clearBenchmarks = {
        type: types.CLEAR_BENCHMARKS,
    };

    const resetView = {
        type: types.VIEW_RESET,
    };

    const projectSelected = {
        type: types.PROJECT_SELECTED,
        id: projectId,
    };

    const expectedActions = [clearBenchmarks, resetView, projectSelected, benchmarksReceived];

    return { expectedActions, projects, projectId };
};

describe('projects actions', () => {
    afterEach(() => {
        fetchMock.restore();
    });

    describe('fetchProjectsIfNeeded', () => {
        it('should dispatch projectsReceived with projects after fetch', async () => {
            const { expectedAction } = mockFetchProjects();

            const store = mockStore({ projects: { items: [] } });
            await store.dispatch(actions.fetchProjectsIfNeeded());
            expect(store.getActions()).toEqual([expectedAction]);
        });

        it('should NOT dispatch projectsReceived if store already has projects', async () => {
            const { response } = mockFetchProjects();

            const store = mockStore({ projects: { items: response } });
            await store.dispatch(actions.fetchProjectsIfNeeded());
            expect(store.getActions()).toEqual([]);
        });
    });

    describe('selectProject', () => {
        it('should dispatch: clearBenchmarks, resetView, benchmarksReceived, and projectSelected', async () => {
            const { expectedActions, projects, projectId } = mockSelectProject();

            const store = mockStore({ projects, view: { timing: 'all' } });
            await store.dispatch(actions.selectProject({ id: projectId }, true));
            expect(store.getActions()).toEqual(expectedActions);
        });
    });
});
