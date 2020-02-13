import { LightningElement, api } from 'lwc';
import { BrowserSpec } from '@best/types/src';

export default class ConnectedClient extends LightningElement {
    @api clientId?: string;
    @api name = '';
    @api state: string = 'IDLE';
    @api specs?: BrowserSpec;
}
