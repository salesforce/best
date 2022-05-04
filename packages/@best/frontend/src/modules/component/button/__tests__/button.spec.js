import { createElement } from 'lwc';
import Button from 'component/button';

describe('component-button', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('has correct default class', () => {
        const element = createElement('component-button', { is: Button });

        document.body.appendChild(element);

        expect(element).toMatchSnapshot();
        const button = element.shadowRoot.querySelector('button');
        const classes = [...button.classList];
        expect(classes).toEqual(['primary', 'default']);
    });

    it('has correct class with override size', () => {
        const element = createElement('component-button', { is: Button });
        element.size = 'small';

        document.body.appendChild(element);

        expect(element).toMatchSnapshot();
        const button = element.shadowRoot.querySelector('button');
        const classes = [...button.classList];
        expect(classes).toEqual(['primary', 'small']);
    });

    it('has correct class with override flavor', () => {
        const element = createElement('component-button', { is: Button });
        element.flavor = 'close';

        document.body.appendChild(element);

        expect(element).toMatchSnapshot();
        const button = element.shadowRoot.querySelector('button');
        const classes = [...button.classList];
        expect(classes).toEqual(['close', 'default']);
    });

    it('has correct class with override flavor and size', () => {
        const element = createElement('component-button', { is: Button });
        element.size = 'small';
        element.flavor = 'close';

        document.body.appendChild(element);

        expect(element).toMatchSnapshot();
        const button = element.shadowRoot.querySelector('button');
        const classes = [...button.classList];
        expect(classes).toEqual(['close', 'small']);
    });
});
