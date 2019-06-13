import { buildArgs } from "../index";

describe("cli options", () => {
    test("test default path args", () => {
        const result = buildArgs(["path"]);
        expect(result._).toStrictEqual(["path"]);
    });
});
