/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { buildArgs } from "../index";

describe("cli options", () => {
    test("test default path args", () => {
        const result = buildArgs(["path"]);
        expect(result._).toStrictEqual(["path"]);
    });
});
