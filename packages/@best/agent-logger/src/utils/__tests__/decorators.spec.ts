import { memoizedThrottle } from '../decorators';

const WAIT = 250;
const NAME_A = 'name-a';
const NAME_B = 'name-b';

class TestClass {
    @memoizedThrottle(WAIT, { length: 1 })
    test(name: string) {
        this.innerFunc(name);
    }

    innerFunc(name: string) {
        return [name];
    }
}

describe('memoizedThrottle', () => {
    jest.useFakeTimers()
    test('function called once immediately', () => {
        const test = new TestClass();
        const spy = jest.spyOn(test, 'innerFunc');
        test.test(NAME_A);
        test.test(NAME_A);

        expect(spy).toBeCalledTimes(1);
    })

    test('function called only once within window', () => {
        const test = new TestClass();
        const spy = jest.spyOn(test, 'innerFunc');
        test.test(NAME_A);
        jest.advanceTimersByTime(WAIT - 1);
        test.test(NAME_A);

        expect(spy).toBeCalledTimes(1);
    })

    test('function called again after window', () => {
        const test = new TestClass();
        const spy = jest.spyOn(test, 'innerFunc');
        test.test(NAME_A);
        test.test(NAME_A);
        jest.advanceTimersByTime(WAIT);
        test.test(NAME_A);

        expect(spy).toBeCalledTimes(2);
    })

    test('decorator gets attached to each instance', () => {
        const testA = new TestClass();
        const spyA = jest.spyOn(testA, 'innerFunc');
        const testB = new TestClass();
        const spyB = jest.spyOn(testB, 'innerFunc');
        testA.test(NAME_A);
        testA.test(NAME_A);
        testB.test(NAME_A);
        testB.test(NAME_A);

        expect(spyA).toBeCalledTimes(1);
        expect(spyB).toBeCalledTimes(1);
    })

    test('function gets called multiple times with different first arguments', () => {
        const test = new TestClass();
        const spy = jest.spyOn(test, 'innerFunc');
        test.test(NAME_A);
        test.test(NAME_B);

        expect(spy).toBeCalledTimes(2);
    })
})