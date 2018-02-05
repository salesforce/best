import { Element, unwrap, api, track } from 'engine';

const Labels = {
    'empty'        : 'No recent Items',
    'buttonAltText': 'Dropdown Trigger'
};

function createEvent(eventName, action, contextAction) {
    const detailAction = action ? Object.assign({}, unwrap(action)) : null;
    const event = new CustomEvent(eventName, {
        bubbles: true,
        cancelable: true,
        detail: {
            action: detailAction,
            contextAction
        },
    });
    return event;
}

export default class AppNavBarItemDropdown extends Element {
    @track state = {
        loading      : false,
        loadedItems  : false,
        emptyDropdown: false
    };

    @api label;
    @api entityApiName;
    @api dropdownMenu;
    @api temporary;
    @api action;

    _dropdownMenu;

    get classNames() {
        return `slds-context-bar__label-action slds-p-left--none ${this.temporary ? 'slds-p-right--x-small' : ''}`;
    }

    @api
    get dropdownMenu() {
        return this._dropdownMenu;
    }

    @api
    set dropdownMenu(newValue) {
        this._dropdownMenu = newValue;
        this.handleDropDownChange(!newValue || !newValue.length);
    }

    get buttonAltText() {
        return Labels.buttonAltText.replace('{0}', this.label);
    }

    get isLoading() {
        return this.state.loading;
    }

    get isEmptyDropdown() {
        return !this.state.loading && this.state.emptyDropdown;
    }

    get hasDropdownItems() {
        return !this.state.loading && this.state.loadedItems && !this.state.emptyDropdown;
    }

    get dropdownItems() {
        return this.state.dropdownItems;
    }

    set dropdownItems(value) {
        this.state.dropdownItems = value;
    }

    get i18n() {
        return Labels;
    }

    handleDropDownChange(isEmpty) {
        const items =
            this.dropdownMenu &&
            this.dropdownMenu.map((item, index) => ({
                id       : `dd_${index}`,
                // eslint-disable-next-line no-script-url
                url      : item.url || 'javascript:void(0)',
                className: item.className,
                label    : item.label,
                iconKey  : item.iconKey,
                action   : item.action,
                separator: item.separator,
                section  : item.section
            }));

        this.dropdownItems = items;

        this.state.loadedItems = !!items;
        this.state.loading = false;
        this.state.emptyDropdown = isEmpty;
    }

    handleSelect(event) {
        event.stopPropagation();
        const detail = event.detail || {};
        const dropdownItem = this.dropdownItems.find(
            item => item.id === detail.actionId
        );

        if (dropdownItem) {
            this.dispatchEvent(createEvent('select', dropdownItem.action, this.action));
        }
    }

    loadMenuItems() {
        if (!this.state.loadedItems) {
            this.state.loading = true;
        }

        this.dispatchEvent(createEvent('showmenu', null, this.action));
    }
}
