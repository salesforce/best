import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import fetchMock from 'fetch-mock'

import * as types from 'store/shared'
import * as actions from 'store/actions'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

const mockFetchProjects = () => {
    const response = [{
        id: 1,
        name: 'foo'
    }, {
        id: 2,
        name: 'bar'
    }]

    fetchMock.getOnce(/projects/, {
        body: { projects: response },
        headers: { 'content-type': 'application/json' }
    })

    const expectedAction = {
        type: types.PROJECTS_RECEIVED,
        projects: response
    }

    return { expectedAction, response }
}

const cloneSortSnapshots = (snapshots) => [...snapshots].sort((a, b) => a.id - b.id);

const mockSelectProject = (withTemporary = false) => {
    const projectId = 1

    const projects = {
        items: [{
            id: projectId,
            name: 'Hello'
        }],
        selectedProjectId: undefined
    }

    const response = [{
        id: 1,
        projectId,
        name: 'bench-1',
        commit: 'aaaaaaa',
        commitDate: '2019-06-21 17:23:24',
        metrics: [{'name': 'metric-a', 'duration': 5, 'stdDeviation': 1}],
        temporary: false,
        environmentHash: 'asdf',
        similarityHash: 'asdf'
    }]

    const responseWithTemporary = [
        {
            id: 2,
            projectId,
            name: 'bench-1',
            commit: 'aaaaaaa',
            commitDate: '2019-06-21 17:27:30',
            metrics: [{'name': 'metric-a', 'duration': 6, 'stdDeviation': 2}],
            temporary: true,
            environmentHash: 'asdf',
            similarityHash: 'asdf'
        },
        ...response
    ]

    const transformedResponse = [{
        commitDates: ['June 21'],
        commits: ['aaaaaaa'],
        environmentHashes: ['asdf'],
        similarityHashes: ['asdf'],
        isTemporary: [false],
        metrics: [{'name': 'metric-a', 'durations': [5], 'stdDeviations': [1]}],
        name: 'bench-1'
    }]

    const transformedResponseWithTemporary = [{
        commitDates: ['June 21', 'June 21'],
        commits: ['aaaaaaa', 'aaaaaaa'],
        environmentHashes: ['asdf', 'asdf'],
        similarityHashes: ['asdf', 'asdf'],
        isTemporary: [false, true],
        metrics: [{'name': 'metric-a', 'durations': [5, 6], 'stdDeviations': [1, 2]}],
        name: 'bench-1'
    }]

    fetchMock.getOnce(/snapshots/, {
        body: { snapshots: withTemporary ? responseWithTemporary : response },
        headers: { 'content-type': 'application/json' }
    })

    const benchmarksReceived = {
        type: types.BENCHMARKS_RECEIVED,
        snapshots: cloneSortSnapshots(withTemporary ? responseWithTemporary : response),
        benchmarks: withTemporary ? transformedResponseWithTemporary : transformedResponse
    }

    const clearBenchmarks = {
        type: types.CLEAR_BENCHMARKS
    }

    const resetView = {
        type: types.VIEW_RESET
    }

    const projectSelected = {
        type: types.PROJECT_SELECTED,
        id: projectId
    }

    const expectedActions = [clearBenchmarks, resetView, projectSelected, benchmarksReceived]

    return { expectedActions, projects, projectId }
}

describe('projects actions', () => {
    afterEach(() => {
        fetchMock.restore()
    })

    describe('fetchProjectsIfNeeded', () => {
        it('should dispatch projectsReceived with projects after fetch', async () => {
            const { expectedAction } = mockFetchProjects()

            const store = mockStore({ projects: { items: [] } })
            await store.dispatch(actions.fetchProjectsIfNeeded())
            expect(store.getActions()).toEqual([expectedAction])
        })

        it('should NOT dispatch projectsReceived if store already has projects', async () => {
            const { response } = mockFetchProjects()

            const store = mockStore({ projects: { items: response } })
            await store.dispatch(actions.fetchProjectsIfNeeded())
            expect(store.getActions()).toEqual([])
        })
    })

    describe('selectProject', () => {
        describe('should dispatch: clearBenchmarks, resetView, benchmarksReceived, and projectSelected', () => {
            it('for normal responses', async () => {
                const { expectedActions, projects, projectId } = mockSelectProject();

                const store = mockStore({ projects, view: { timing: 'all' } })
                await store.dispatch(actions.selectProject({ id: projectId }, true))
                expect(store.getActions()).toEqual(expectedActions)
            })

            it('for unsorted responses that include temporary results', async () => {
                const { expectedActions, projects, projectId } = mockSelectProject(true);

                const store = mockStore({ projects, view: { timing: 'all' } })
                await store.dispatch(actions.selectProject({ id: projectId }, true))
                expect(store.getActions()).toEqual(expectedActions)
            })
        })
    })
})
