import { createElement } from 'engine';
import PrimitiveIcon from 'one-tmp-primitive-icon';

describe('one-tmp-primitive-icon', () => {
    beforeEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('default snapshot', () => {
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        expect(element).toMatchSnapshot();
    });

    it('svg element has slds-icon class', () => {
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        const svg = element.querySelector('svg');
        expect(svg.classList).toContain("slds-icon");
    });

    it('svg element has slds-icon-text-default class by default', () => {
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        const svg = element.querySelector('svg');
        expect(svg.classList).toContain("slds-icon-text-default");
    });

    it('updates css class based on size property', () => {
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        const svg = element.querySelector('svg');

        // DOM updates are async so use Promise.resolve() to force waiting for next "tick"
        element.size = "small";
        return Promise.resolve().then(() => {
            expect(svg.classList).toContain("slds-icon--small");
            element.size = "large";
        }).then(() => {
            expect(svg.classList).toContain("slds-icon--large");
            expect(svg.classList).not.toContain("slds-icon--small");
        });
    });

    it('svg element does not have slds-icon class when bare', () => {
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        const svg = element.querySelectorAll('svg')[0];

        element.variant = "bare";
        return Promise.resolve().then(() => {
            expect(svg.classList).not.toContain("slds-icon");
        });
    });

    it('logs error for invalid icon name', () => {
        const invalidName = "mr invalid";
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        // eslint-disable-next-line no-console
        console.error = jest.fn();
        element.iconName = invalidName;
        // eslint-disable-next-line no-console
        expect(console.error).toBeCalled();
        // eslint-disable-next-line no-console
        expect(console.error).lastCalledWith("<one-tmp-primitive-icon> Invalid icon name " + invalidName);
    });

    it('sets href based on icon name', () => {
        const defaultToken = "/_slds/icons/utility-sprite/svg/symbols.svg?cache=8.2.0";
        const iconName = "down";
        const element = createElement('one-tmp-primitive-icon', { is: PrimitiveIcon });
        document.body.appendChild(element);
        const svg = element.querySelector("svg");
        const use = svg.querySelector("use");

        element.iconName = "utility:" + iconName;

        return Promise.resolve().then(() => {
            expect(use.getAttribute("xlink:href")).toBe(defaultToken + "#" + iconName);
        });
    });
});
