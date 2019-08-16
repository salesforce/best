/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export default function cloneState (obj: any): BenchmarkState {
    const stateClone = Object.assign({}, obj);

    if (stateClone.children) {
        stateClone.children = stateClone.children.map((obj: any) => cloneState(obj));
    }

    if (stateClone.run) {
        stateClone.run = Object.assign({}, stateClone.run);
    }

    return stateClone;
}
