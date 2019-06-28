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
        
    })
})