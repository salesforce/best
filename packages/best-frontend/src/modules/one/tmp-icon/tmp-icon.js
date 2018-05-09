import { api, Element } from 'engine';
import { classListMutation, icon as iconUtil } from 'one-tmp-utils';

const validVariants = new Set([
    'error',
    'inverse',
    'warning',
]);

export default class LightningIcon extends Element {
    @api alternativeText;
    @api iconName;
    @api size;
    @api variant;

    constructor() {
        super();
        this.state.category = '';
        this.classList.add('slds-icon_container');
    }

    get normalizedVariant() {
        let variant = this.variant ? this.variant.toLowerCase() : '';

        // Unfortunately, the `bare` variant was implemented to do what the
        // `inverse` variant should have done. This adds support for the
        // `inverse` variant while continuing to support the `bare` variant.
        if (variant === 'bare') {
            variant = 'inverse';
        }

        if (variant && !validVariants.has(variant)) {
            window.console.error(`${this} Invalid variant "${variant}"`);
        }

        if (this.state.category !== 'utility') {
            if (variant) {
                window.console.warn(`${this} The "${variant}" variant may not be used with the icon category "${this.state.category}". Variants are meant to be used with "utility" icons.`);
            }
            // If a non-utility icon, use the 'bare' variant
            variant = 'bare';
        }

        return variant;
    }

    handleIconNameChange(oldValue, newValue) {
        if (iconUtil.isValidName(newValue)) {
            this.state.category = iconUtil.getCategory(newValue);
            classListMutation(this.classList, {
                'slds-icon_container--circle': this.state.category === 'action',
                [iconUtil.computeSldsClass(newValue)]: true,
                [iconUtil.computeSldsClass(oldValue)]: false,
            });
        } else {
            console.error(`${this} Invalid icon name ${newValue}`);
        }
    }

    static observedAttributes = ['icon-name'];
    attributeChangedCallback(attr, oldValue, newValue) {
        if (attr === 'icon-name') {
            this.handleIconNameChange(oldValue, newValue);
        }
    }
}
