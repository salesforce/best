/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { LightningElement, api } from 'lwc';

const ITEMS = Array.apply(null, Array(20000)).map((k, i) => i);

export default class SimpleItem extends LightningElement {
    @api title = 'benchmark';
    @api flavor;
    items = ITEMS;
}
