import { buildCustomElementConstructor, register } from 'lwc';
import { registerWireService } from '@lwc/wire-service';

import App from 'view/app';

registerWireService(register);

customElements.define('view-app', buildCustomElementConstructor(App));