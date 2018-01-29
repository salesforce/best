import { MOCK_DATA_SMALL } from "./mock_data";

describe('deep_clone', () => {
    benchmark('stringify_parse', () => {
        run(() => {
            JSON.parse(JSON.stringify(MOCK_DATA_SMALL));
        });
    });

    benchmark('object_assign', () => {
        run(() => {
            Object.assign({}, MOCK_DATA_SMALL);
        });
    });
});
