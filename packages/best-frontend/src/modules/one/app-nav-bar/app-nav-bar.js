import { Element, unwrap, api, track } from 'engine';
import { debounce } from './utils.js';
import { classSet } from 'one-tmp-utils';

const Labels = {
    'more'     : 'More',
    'showMore' : 'ShowMore',
    'noItems'  : 'NoItems',
    'editTabs' : 'EditTabs',
    'globalNav': 'GlobalNav',
    'editTabsAssistiveText' : 'EditTabsAssistiveText'
};

// resize delay before re-calculating new visibility
const RESIZE_DEBOUNCE = 300;

/**
 * The horizontal app navigation bar used in the Global Nav.
 */
export default class AppNavBar extends Element {
    @track state = {
        /* The visible horizonal width of the nav bar */
        availableWidth : 0,
        /* The provided items plus additional nav bar specific metadata */
        navItems : [],
        /* The width of the overflow menu dropdown target */
        overflowMenuWidth : 0,
        /* The total width of all the nav items */
        requiredWidth : 0,
        /* The width of the pencil button */
        editTabsButtonWidth : 0,
        selectedItemId : '',
        visibleItemCount : 0
    };

    @api items;
    @api selectedItemId;
    @api cmnEnabled;
    @api editInfoMessage;

    @api get items() {
        return this.state.navItems;
    }

    @api set items(newValue) {
        this.state.navItems = newValue || [];
        this.doneMeasuring = false;
    }

    @api set selectedItemId(newValue) {
        const previous = this.state.selectedItemId;
        const item = this.getNavItem(newValue);

        this.state.selectedItemId = newValue;

        // W-4528156: only reflow the nav items if:
        // 1. there wasn't a previously selected tab, or
        // 2. the newly selected tab is coming from the overflow
        if (!previous || (item && item.hidden)) {
            this.updateOverflowLayout();
        } else {
            this.state.navItems.forEach(i => {
                i.selected = i.id === newValue;
            });
        }
    }

    @api get selectedItemId() {
        return this.state.selectedItemId;
    }

    @api get editInfoMessage() {
        return this.state.editInfoMessage;
    }

    @api set editInfoMessage(newValue) {
        this.state.editInfoMessage = newValue; // info message is text provided when editing is not available
        this.state.showPencil = !newValue;
    }

    doneMeasuring = false;

    constructor() {
        super();
        /* default initial classes */
        this.classList.add('slds-grid', 'slds-has-flexi-truncate', 'slds-hidden');
        /* window resize handler: changes visible items */
        this.onResize = debounce(() => {
            this.state.availableWidth = this.getAvailableWidth();
            this.updateOverflowLayout();
        }, RESIZE_DEBOUNCE);
    }

    // -- Template  -----------------------------------------------------------

    get computedOverflowClass() {
        return classSet({
            hidden                              : this.hasNoOverflow,
            'slds-context-bar__item'            : true,
            'slds-context-bar__dropdown-trigger': true,
            'slds-shrink-none'                  : true,
            'slds-is-unsaved'                   : this.hasHiddenTempTabs
        }).toString();
    }

    get hasNoOverflow() {
        return this.state.visibleItemCount === this.state.navItems.length;
    }

    get hasHiddenTempTabs() {
        const items = this.state.navItems;
        let result = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].hidden && items[i].isTemporary) {
                result = true;
                break;
            }
        }
        return result;
    }

    get overflowItems() {
        const overflowTemp = [];
        const overflowPerm = [];
        this.state.navItems.forEach(item => {
            if (item.hidden) {
                // We want temp tabs at the top, and they're going to get added in a particular order (see below),
                // so we need to keep these two 'sections' separate and join them later.
                if (item.isTemporary) {
                    overflowTemp.push(item);
                } else {
                    overflowPerm.push(item);
                }
            }
        });

        // Temp tabs are ordered by most-recently-created. The id field contains a timestamp for comparison.
        overflowTemp.sort((a, b) => {
            return (a.id < b.id) ? 1 : (b.id < a.id) ? -1 : 0;
        });

        return overflowTemp.concat(overflowPerm);
    }

    handleSelect(event) {
        // <one-app-nav-bar-item custom-id={navItem.id}> and <lightning-menu-item value={navItem.id}>
        const nextSelectedId = event.target.customId || event.target.value;

        // TODO: Refactor to have the dropdown trigger fire a different event (everyone is firing 'select'!)
        if (!nextSelectedId || nextSelectedId === this.state.selectedItemId) {
            return; // do nothing when same nav item is selected
        }

        event.stopPropagation();

        this.state.selectedItemId = nextSelectedId;
        this.state.navItems.forEach(item => {
            item.selected = item.id === nextSelectedId;
        });

        const selectedItem = this.getNavItem(nextSelectedId);
        const action = unwrap(selectedItem.navAction);

        this.dispatchEvent(new CustomEvent('select', {
            bubbles   : true,
            cancelable: true,
            detail    : { action: action && Object.assign({}, action) },
        }));
    }

    get hasNoItems() {
        return this.state.navItems.length === 0;
    }

    get i18n() {
        return Labels;
    }

    // -- Lifecycle -----------------------------------------------------------

    connectedCallback() {
        window.addEventListener('resize', this.onResize);
    }

    renderedCallback() {
        if (!this.doneMeasuring) {
            this.state.availableWidth = this.getAvailableWidth();
            this.state.overflowMenuWidth = this.getOverflowWidth();
            this.state.editTabsButtonWidth = this.getPencilWidth();
            this.state.requiredWidth = this.getRequiredWidth();
            this.updateOverflowLayout();
            this.classList.remove('slds-hidden');
            this.doneMeasuring = true;
        }
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.onResize);
    }

    // -- Private helpers -----------------------------------------------------

    updateOverflowLayout() {
        let availableWidth = this.state.availableWidth;
        if (availableWidth < this.state.requiredWidth) {
            availableWidth -= this.state.overflowMenuWidth;   // Reserve space for the overflow menu trigger
            availableWidth -= this.state.editTabsButtonWidth; // Reserve space for "Edit Tabs" button
            const selectedItem = this.getNavItem(this.state.selectedItemId);
            availableWidth -= selectedItem ? selectedItem.width : 0; // Reserve space for the selected item
        }

        let numVisible = 0;
        this.state.navItems.forEach(item => {
            item.selected = item.id === this.state.selectedItemId;
            if (!item.selected) {
                availableWidth -= item.width;
            }
            item.hidden = !item.selected && availableWidth < 0;

            if (!item.hidden) {
                numVisible++;
            }
        });

        this.state.visibleItemCount = numVisible;
    }

    getNavItem(id) {
        if (id) {
            return this.state.navItems.find(item => id === item.id);
        }
        return null;
    }

    getAvailableWidth() {
        return this.getBoundingClientRect().width;
    }

    getRequiredWidth() {
        const elements = this.root.querySelectorAll('li[is="one-app-nav-bar-item-root"]');
        const width = this.state.navItems.reduce((totalWidth, item, index) => {
            item.width = this.getWidth(elements[index]);
            return totalWidth + item.width;
        }, 0);
        return width + this.state.editTabsButtonWidth;
    }

    getWidth(el) {
        return parseFloat(el.getBoundingClientRect().width, 10);
    }

    getOverflowWidth() {
        return this.getWidth(this.root.querySelector('.slds-context-bar__dropdown-trigger'));
    }

    getPencilWidth() {
        if (!this.cmnEnabled) {
            return 0;
        }
        return this.getWidth(this.root.querySelector('.editGlobalNav'));
    }

    handleEditTabs() {
        // this event will be handled by one:appNavContainer
        this.dispatchEvent(new CustomEvent("edittabs", {
            bubbles   : true,
            cancelable: true,
            detail    : {}
        }));
    }
}
