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
      parent
    };
  };


export const makeBenchmark = (name, parent, mode) => {
    if (parent && !mode) {
        // If not set explicitly, inherit from the parent describe.
        mode = parent.mode;
    }

    return {
        duration: null,
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



export const makeBenchmarkRun = (fn, mode, name, parent) => {
    if (!fn) {
      mode = 'skip'; // skip test if no fn passed
    } else if (!mode) {
      // if not set explicitly, inherit from its parent describe
      mode = parent.mode;
    }

    return {
        duration: null,
        errors: [],
        fn,
        mode,
        name,
        parent,
        startedAt: null,
        status: null,
    };
};
