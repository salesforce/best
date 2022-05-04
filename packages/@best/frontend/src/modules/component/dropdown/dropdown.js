import { LightningElement, api, track } from 'lwc';

export default class ComponentDropdown extends LightningElement {
    @api name;
    @api options;

    @track stateClass = 'closed';

    get controlClasses() {
        return `control ${this.stateClass}`;
    }

    get hasSelectedItems() {
        return !!this.options.selectedItems.length;
    }

    get hasItems() {
        return !!this.options && !!this.options.items.length;
    }

    itemSelected(event) {
        const itemIndex = parseInt(event.target.dataset.index, 10);
        const item = this.options.items[itemIndex];

        this.dispatchEvent(
            new CustomEvent('selection', {
                detail: {
                    selectedItems: [item],
                },
            }),
        );

        this.toggleItems();
    }

    toggleItems() {
        if (this.stateClass === 'closed') {
            this.stateClass = 'open';
        } else {
            this.stateClass = 'closed';
        }
    }
}
