import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import * as reducers from './reducers';
import * as urlstorage from './urlstorage';

// const loggerMiddleware = store => next => action => {
//     console.group(action.type);
//     console.info('dispatching', action);

//     let result = next(action);

//     console.log('next state', store.getState());
//     console.groupEnd();

//     return result;
// };

export const store = createStore(
    combineReducers(reducers),
    urlstorage.loadState(),
    applyMiddleware(thunk, urlstorage.middleware),
);

export { connectStore } from './wire-adapter';
