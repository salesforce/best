import { MOCK_DATA_SMALL } from '../mock_data';
import merge from '../deep_merge';

describe('deep_clone2', () => {
    benchmark('stringify_parse2', () => {
        run(() => {
            JSON.parse(JSON.stringify(MOCK_DATA_SMALL));
        });
    });

    benchmark('deep_merge2', () => {
        run(() => {
            merge({}, MOCK_DATA_SMALL);
        });
    });
});
