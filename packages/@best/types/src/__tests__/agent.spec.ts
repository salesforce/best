/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { AgentState } from './../agent';

describe('AgentSpec', () => {
    it('Should be defined', () => {
        expect(AgentState).not.toBeUndefined();
    });

    it('Should have the expected number of values', () => {
        expect(Object.keys(AgentState).length).toBe(2);
    });

    describe('Should have the expected values', () => {
        Object.values(AgentState).forEach((value) => {
            it(`${value}`, () => {
                expect(AgentState[value]).toBe(value);
            });
        });
    });
});
