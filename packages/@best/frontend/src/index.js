import { buildCustomElementConstructor, register } from 'lwc';
import { registerWireService } from '@lwc/wire-service';

import MyApp from 'my/app';

registerWireService(register);

customElements.define('my-app', buildCustomElementConstructor(MyApp));