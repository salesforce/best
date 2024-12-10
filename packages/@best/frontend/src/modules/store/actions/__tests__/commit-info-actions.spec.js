import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import fetchMock from 'fetch-mock';

import * as types from 'store/shared';
import * as actions from 'store/actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockFetchAPI = (shoudError) => {
    if (shoudError) {
        const fullCommit = 'abcdefghijklmnop';
        const shortCommit = 'abcdefg';
        const response = { error: { reason: 'URL failed mocked!' } };

        fetchMock.getOnce(/api\/v1\/info/, {
            body: response,
            headers: { 'content-type': 'application/json' },
        });

        const expectedAction = {
            type: types.COMMIT_INFO_RECEIVED,
            commit: shortCommit,
            commitInfo: response,
        };

        return { fullCommit, shortCommit, expectedAction };
    }

    const fullCommit = 'abcdefghijklmnop';
    const shortCommit = 'abcdefg';
    const response = {
        fullCommit: fullCommit,
        body: 'commit body',
        url: 'github.com/blahblah',
        username: 'username',
        profileImage: 'gravatar_url',
    };

    fetchMock.getOnce(/api\/v1\/info/, {
        body: { commit: response },
        headers: { 'content-type': 'application/json' },
    });

    const expectedAction = {
        type: types.COMMIT_INFO_RECEIVED,
        commit: shortCommit,
        commitInfo: response,
    };

    return { fullCommit, shortCommit, expectedAction };
};

describe('commit info actions', () => {
    afterEach(() => {
        fetchMock.restore();
    });

    describe('fetchCommitInfoIfNeeded', () => {
        it('should dispatch commitInfoReceived with error after failing to fetch commit info', async () => {
            const { fullCommit, expectedAction } = mockFetchAPI(true);

            const store = mockStore({ commitInfo: {} });
            await store.dispatch(actions.fetchCommitInfoIfNeeded(fullCommit));
            expect(store.getActions()).toEqual([expectedAction]);
        });

        it('should dispatch commitInfoReceived with success', async () => {
            const { fullCommit, expectedAction } = mockFetchAPI(false);

            const store = mockStore({ commitInfo: {} });
            await store.dispatch(actions.fetchCommitInfoIfNeeded(fullCommit));
            expect(store.getActions()).toEqual([expectedAction]);
        });

        it('should NOT dispatch commitInfoReceived if store already has commit', async () => {
            const { fullCommit, shortCommit, response } = mockFetchAPI(false);

            const store = mockStore({ commitInfo: { [shortCommit]: response } });
            await store.dispatch(actions.fetchCommitInfoIfNeeded(fullCommit));
            expect(store.getActions()).toEqual([]);
        });
    });
});
