import { version as VERSION } from '../package.json';
import { run } from './cli';

module.exports = {
    getVersion: () => VERSION,
    run,
};
