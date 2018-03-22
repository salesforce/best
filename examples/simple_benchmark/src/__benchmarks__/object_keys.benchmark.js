import { MOCK_DATA_SMALL } from './mock_data';
import merge from './deep_merge';

describe('deep_clone', () => {
    benchmark('stringify_parse', () => {
        run(() => {
            JSON.parse(JSON.stringify(MOCK_DATA_SMALL));
        });
    });

    benchmark('deep_merge', () => {
        run(() => {
            merge({}, MOCK_DATA_SMALL);
        });
    });
});
