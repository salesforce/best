/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import * as agent from './../agent';

describe('AgentSpec', () => {
    it('Should be defined', () => {
        expect(agent.AgentState).not.toBeUndefined();
    });

    it('Should have the expected number of values', () => {
        expect(Object.keys(agent.AgentState).length).toBe(2);
    });

    describe('Should have the expected values', () => {
        ['BUSY', 'IDLE'].forEach((value) => {
            it(`${value}`, () => {
                expect(agent.AgentState[value]).toBe(value);
            });
        });
    });
});
