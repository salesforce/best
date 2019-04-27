#!/usr/bin/env node

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'perf';
}

require('../build/cli').run();
