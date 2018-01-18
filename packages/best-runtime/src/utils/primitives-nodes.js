import { RUN_BENCHMARK } from '../constants';
export const makeDescribe = (name, parent, mode) => {
    if (parent && !mode) {
        // If not set explicitly, inherit from the parent describe.
        mode = parent.mode;
    }

    return {
        children: [],
        hooks: [],
        mode,
        name,
        parent,
    };
};

export const makeBenchmark = (name, parent, mode) => {
    if (parent && !mode) {
        // If not set explicitly, inherit from the parent describe.
        mode = parent.mode;
    }

    return {
        duration: 0,
        runDuration: 0,
        children: [],
        errors: [],
        hooks: [],
        run: null,
        mode,
        name,
        parent,
        startedAt: null,
        status: null,
    };
};

export const makeBenchmarkRun = (fn, parent) => {
    return {
        duration: null,
        errors: [],
        fn,
        name: RUN_BENCHMARK,
        parent,
        startedAt: null,
        status: null,
    };
};
