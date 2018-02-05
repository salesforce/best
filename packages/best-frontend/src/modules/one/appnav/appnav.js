import { Element } from 'engine';
import { isPureLeftClick } from 'one-tmp-utils';
const NAV_TYPE_HORIZONTAL = 'horizontal';
const NAV_TYPE_DROPDOWN = 'dropdown';

const DEFAULT_APP_NAME = 'Best';

export default class AppNav extends Element {
    @api showAppLauncher;
    @api appName = DEFAULT_APP_NAME;
    @api appNavType = NAV_TYPE_HORIZONTAL;
    @api selectedItemId;
    @api navItems;
    @api cmnEnabled;

    constructor() {
        super();
        this.showAppLauncher = true;
        this.addEventListener('select', this.handleSelect.bind(this));
        this.addEventListener('showmenu', this.handleShowMenu.bind(this));
        this.addEventListener('click', e => {
            if (isPureLeftClick(e)) {
                e.preventDefault();
            }
        });
    }

    get isHorizontalAppNavType() {
        return this.appNavType === NAV_TYPE_HORIZONTAL;
    }

    get isDropDownNavType() {
        return this.appNavType === NAV_TYPE_DROPDOWN;
    }

    handleSelect(event) {
        const action = (event.detail && event.detail.action) || event.target.action;
        this.dispatchEvent(new CustomEvent("itemselected", {
            bubbles   : true,
            cancelable: true,
            detail    : { action }
        }));
    }

    handleShowMenu(event) {
        const detail = event.detail;
        const entityApiName = event.target.entityApiName;
        const action = (detail && detail.action);// || event.target.action;
        const contextAction = (detail && detail.contextAction);
        const temporary = (detail && detail.temporary);
        const selected = (detail && detail.selected);
        this.dispatchEvent(new CustomEvent("showitemmenu", {
            bubbles   : true,
            cancelable: true,
            detail    : { action, entityApiName, contextAction, temporary, selected }
        }));
    }
}
