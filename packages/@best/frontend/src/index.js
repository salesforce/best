/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { buildCustomElementConstructor, register } from 'lwc';
import { registerWireService } from '@lwc/wire-service';

import App from 'view/app';

registerWireService(register);

customElements.define('view-app', buildCustomElementConstructor(App));
