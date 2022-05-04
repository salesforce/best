import { LightningElement, api } from 'lwc';

export default class ComponentButton extends LightningElement {
    @api flavor = 'primary';
    @api size = 'default';

    get classNames() {
        return [this.flavor, this.size].join(' ');
    }
}
