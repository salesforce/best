/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { BrowserSpec } from "@best/types";

export function matchSpecs(specs: BrowserSpec, runnerSpecs: BrowserSpec[]) {
    return runnerSpecs.some(({ name, version }) => specs.name === name && specs.version.toString() === version.toString());
}
