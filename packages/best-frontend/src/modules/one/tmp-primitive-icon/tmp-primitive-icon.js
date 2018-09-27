import { LightningElement, api, track } from 'lwc';
import { classSet, icon as iconUtil } from 'one-tmp-utils';

const tokenMap = Object.assign(Object.create(null), {
    action  : 'lightning.actionSprite',
    custom  : 'lightning.customSprite',
    doctype : 'lightning.doctypeSprite',
    standard: 'lightning.standardSprite',
    utility : 'lightning.utilitySprite',
});
const defaultTokenValue = Object.assign(Object.create(null), {
    'lightning.actionSprite': '/assets/icons/action-sprite/svg/symbols.svg',
    'lightning.customSprite': '/assets/icons/custom-sprite/svg/symbols.svg',
    'lightning.doctypeSprite': '/assets/icons/doctype-sprite/svg/symbols.svg',
    'lightning.standardSprite': '/assets/icons/standard-sprite/svg/symbols.svg',
    'lightning.utilitySprite': '/assets/icons/utility-sprite/svg/symbols.svg',
});

export default class PrimitiveIcon extends LightningElement {
    @track state = {
        category : '',
        name : ''
    };

    @api iconName;
    @api svgClass;
    @api size = 'medium';
    @api variant;

    renderedCallback() {
        if (this.iconName !== this.prevIconName) {
            this.prevIconName = this.iconName;
        }
    }

    get computedClass() {
        const classes = classSet(this.svgClass);

        if (this.variant !== 'bare') {
            classes.add('slds-icon');
        }

        switch (this.variant) {
            case 'error':
                classes.add('slds-icon-text-error');
                break;
            case 'warning':
                classes.add('slds-icon-text-warning');
                break;
            case 'inverse':
            case 'bare':
                break;
            default:
                classes.add('slds-icon-text-default');
        }

        classes.add({
            'slds-icon--x-small' : this.size === 'x-small',
            'slds-icon--xx-small': this.size === 'xx-small',
            'slds-icon--small'   : this.size === 'small',
            'slds-icon--large'   : this.size === 'large',
        });

        return classes.toString();
    }

    get href() {
        return `${this.getPathPrefix()}${this.getAssetPath()}#${this.state.name}`;
    }

    getAssetPath() {
        return this.getToken(tokenMap[this.state.category]) || this.getDefaultAssetPath();
    }

    getDefaultAssetPath() {
        window.console.warn(`${this} Icon category "${this.state.category}" does not map to a known icon asset. Make sure you are using a valid icon name.`);
        return defaultTokenValue[tokenMap[this.state.category]];
    }

    getPathPrefix() {
        return ''; // $A.getContext().getPathPrefix()
    }

    getToken() {
        return ''; // $A.getToken()
    }

    @api set iconName(newValue) {
        if (iconUtil.isValidName(newValue)) {
            this.state.category = iconUtil.getCategory(newValue);
            this.state.name = iconUtil.getName(newValue);
        } else {
            window.console.error(`${this} Invalid icon name ${newValue}`);
        }
    }

    @api get iconName() {
        return this.state.name;
    }
}
