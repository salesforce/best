import { LightningElement, api } from 'lwc';
import { BrowserSpec } from '@best/types/src';

export default class ComponentAgent extends LightningElement {
    @api agentId?: string;
    @api name = '';
    @api state: string = 'IDLE';
    @api specs: BrowserSpec[] = [];
    @api uri?: string;
}
