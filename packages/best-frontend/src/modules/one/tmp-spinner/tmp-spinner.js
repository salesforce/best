import { Element } from "engine";
import { joinClassNames } from "one-tmp-utils";

export default class LightningSpinner extends Element {
    @api size = 'medium';
    @api alternativeText = '';
    @api containerClasses;
    @api variant;

    constructor() {
        super();
        this.classList.add('slds-spinner_container');
    }

    get privateComputedInnerClass() {
        return joinClassNames('slds-spinner', {
            'slds-spinner--brand'  : this.variant === 'brand',
            'slds-spinner--inverse': this.variant === 'inverse',
            'slds-spinner--small'  : this.size === 'small',
            'slds-spinner--medium' : this.size === 'medium',
            'slds-spinner--large'  : this.size === 'large',
        });
    }
}
