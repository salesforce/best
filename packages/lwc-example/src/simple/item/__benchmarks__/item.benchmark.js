/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { createElement } from 'lwc';
import SimpleItem from 'simple/item';

describe('simple-item', () => {
    benchmark('create_and_render', () => {
        let element;
        run(() => {
            element = createElement('simple-item', { is: SimpleItem });
            element.flavor = 'red'
            document.body.appendChild(element);
        });
        after(() => {
            element.flavor = 'clean'
            return element && element.parentElement.removeChild(element);
        });
    });

    benchmark('update_title', () => {
        let element;
        run(() => {
            element = createElement('simple-item', { is: SimpleItem });
            element.flavor = 'blue'
            element.title = 'TESTING 123'
            document.body.appendChild(element);
        });
        after(() => {
            element.flavor = 'clean'
            return element && element.parentElement.removeChild(element);
        });
    });
})