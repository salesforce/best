import { api, LightingElement } from 'lwc';
import { isPureLeftClick } from 'one-tmp-utils';

const Labels = {
    'closeTab': 'CloseTab',
    'unsaved':  'TabNotSaved'
};

export default class AppNavBarItemRoot extends LightingElement {
    @api customId;
    @api action;
    @api label;
    @api selected;
    @api url;
    @api entityApiName;
    @api dropdownMenu;
    @api isHidden;
    @api temporary;
    @api detail;
    @api showMenu;

    _selected;
    _isHidden;
    _temporary;

    constructor() {
        super();
        this.classList.add('slds-context-bar__item', 'slds-shrink-none');
    }

    @api get selected() {
        return this._selected;
    }

    @api set selected(newValue) {
        this._selected = newValue;
        this.classList[newValue ? 'add' : 'remove']('slds-is-active');
    }

    @api get isHidden() {
        return this._isHidden;
    }

    @api set isHidden(newValue) {
        this._isHidden = newValue;
        this.classList[newValue ? 'add' : 'remove']('hidden');
    }

    @api get temporary() {
        return this._temporary;
    }

    @api set temporary(value) {
        this._temporary = value;
        this.updateStyles();
    }

    connectedCallback() {
        this.updateStyles();
    }

    updateStyles() {
        const action = this.temporary ? 'add' : 'remove';
        this.classList[action]('slds-is-unsaved');
    }

    handleClick(event) {
        if (isPureLeftClick(event)) {
            event.preventDefault();
            const selectEvent = new CustomEvent('select', { bubbles: true, cancelable: true });
            this.dispatchEvent(selectEvent);
        }
    }

    handleClose(event) {
        event.preventDefault();
        const selectEvent = new CustomEvent('removetab', {
            bubbles: true,
            cancelable: true,
            detail: { id: this.customId }
        });
        this.dispatchEvent(selectEvent);
    }

    handleBubble(event) {
        // app-nav-bar-item-root has the current values for the selected and temporary
        // attrs so it sets them on bubbling events from the dropdown menu
        const detail = event.detail;
        detail.selected = this.selected;
        detail.temporary = this.temporary;
    }

    get i18n() {
        return Labels;
    }

    get tabIndex() {
        return this.isHidden ? -1 : 0;
    }
}
