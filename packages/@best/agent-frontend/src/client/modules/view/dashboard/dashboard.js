import { LightningElement, track } from 'lwc';

export default class ViewDashboard extends LightningElement {
    @track agents = [{ id: 1, host: 'http://localhost:5000', name: 'Agent 5000' }];
}
