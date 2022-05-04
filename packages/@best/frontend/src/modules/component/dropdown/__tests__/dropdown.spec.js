import { createElement } from 'lwc';
import Dropdown from 'component/dropdown';

describe('component-dropdown', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('display correct text and data-index with one selected item', () => {
        const selectedItem = {
            title: 'First Selected Item',
            id: 'item-one',
        };

        const items = [
            selectedItem,
            {
                title: 'Second Item',
                id: 'item-two',
            },
            {
                title: 'Third Item',
                id: 'item-three',
            },
        ];

        const element = createElement('component-dropdown', { is: Dropdown });
        element.options = {
            multiple: false,
            items,
            selectedItems: [selectedItem],
        };

        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            expect(element).toMatchSnapshot();
            const selectedItemElement = element.shadowRoot.querySelector('.selected-item');
            expect(selectedItemElement.textContent).toBe(selectedItem.title);
            expect(parseInt(selectedItemElement.dataset.index, 10)).toBe(0);
        });
    });

    it('displays no selected items when none are provided', () => {
        const items = [
            {
                title: 'First Selected Item',
                id: 'item-one',
            },
            {
                title: 'Second Item',
                id: 'item-two',
            },
            {
                title: 'Third Item',
                id: 'item-three',
            },
        ];

        const element = createElement('component-dropdown', { is: Dropdown });
        element.options = {
            multiple: false,
            items,
            selectedItems: [],
        };

        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            expect(element).toMatchSnapshot();
            const allSelectedItemElements = element.shadowRoot.querySelectorAll('.selected-item');
            expect(allSelectedItemElements).toHaveLength(0);
        });
    });

    it('displays no items when none are provided', () => {
        const element = createElement('component-dropdown', { is: Dropdown });
        element.options = {
            multiple: false,
            items: [],
            selectedItems: [],
        };

        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            expect(element).toMatchSnapshot();
            const allItemElements = element.shadowRoot.querySelectorAll('.item');
            expect(allItemElements).toHaveLength(0);
        });
    });

    it('displays items in correct order', () => {
        const items = [
            {
                title: 'First Selected Item',
                id: 'item-one',
            },
            {
                title: 'Second Item',
                id: 'item-two',
            },
            {
                title: 'Third Item',
                id: 'item-three',
            },
        ];

        const element = createElement('component-dropdown', { is: Dropdown });
        element.options = {
            multiple: false,
            items,
            selectedItems: [],
        };

        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            expect(element).toMatchSnapshot();
            const allItemElements = element.shadowRoot.querySelectorAll('.item');
            expect(allItemElements).toHaveLength(items.length);

            items.forEach((item, index) => {
                const itemElement = allItemElements[index];
                expect(itemElement.textContent).toBe(item.title);
                expect(parseInt(itemElement.dataset.index, 10)).toBe(index);
            });
        });
    });

    it('fires selection event when item is clicked', () => {
        const items = [
            {
                title: 'First Selected Item',
                id: 'item-one',
            },
            {
                title: 'Second Item',
                id: 'item-two',
            },
            {
                title: 'Third Item',
                id: 'item-three',
            },
        ];

        const element = createElement('component-dropdown', { is: Dropdown });
        element.options = {
            multiple: false,
            items,
            selectedItems: [],
        };
        const evtListenerMock = jest.fn();
        element.addEventListener('selection', evtListenerMock);

        document.body.appendChild(element);

        return Promise.resolve().then(() => {
            const itemElement = element.shadowRoot.querySelector('.item');
            itemElement.click();
            expect(evtListenerMock).toHaveBeenCalledTimes(1);
        });
    });
});
