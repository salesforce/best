import memoize from 'memoizee'

// Typescript friendly debounce function
// A function must wait duration after the last call to be executed
const debounce = <F extends Function>(method: F, duration: number): F => {
    let timeout: NodeJS.Timeout;

    return <F><any>function (this: any, ...args: any[]) {
        if (timeout) clearTimeout(timeout);

        const _this = this;

        timeout = setTimeout(() => {
            method.apply(_this, args);
        }, duration)
    }
}

// Typescript friendly throttle function
// Ensures the function is called only once inside the `wait` window
const throttle = <F extends Function>(method: F, wait: number): F => {
    let called = false;

    return <F><any>function(this: any, ...args: any[]) {
        if (! called) {
            method.apply(this, args);
            called = true;
            setTimeout(() => {
                called = false;
            }, wait)
        }
    }
}

// Here we create a decorator that debounces the function based on the arguments of the function
// https://github.com/lodash/lodash/issues/2403#issuecomment-290760787
// NOTE: This applied to each instance of the class that this method belongs to.
export const memoizedDebounce = (duration: number, options?: memoize.Options): MethodDecorator => {
    return function (target: any, key: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        return {
            configurable: true,
            enumerable: descriptor.enumerable,
            get: function getter(this: any) {
                const memo = memoize(function (...args: any[]) {
                    return debounce(originalMethod, duration);
                }, options);
                
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    value: function (...args: any[]) {
                        memo.apply(this, args).apply(this, args);
                    }
                })

                return this[key];
            }
        }
    }
}

// Here we create a decorator that throttles the function based on the arguments of the function
// NOTE: This applied to each instance of the class that this method belongs to.
export const memoizedThrottle = (wait: number, options?: memoize.Options): MethodDecorator => {
    return function (target: any, key: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        return {
            configurable: true,
            enumerable: descriptor.enumerable,
            get: function getter(this: any) {
                const memo = memoize(function (...args: any[]) {
                    return throttle(originalMethod, wait);
                }, options);
                
                Object.defineProperty(this, key, {
                    configurable: true,
                    enumerable: descriptor.enumerable,
                    value: function (...args: any[]) {
                        memo.apply(this, args).apply(this, args);
                    }
                })

                return this[key];
            }
        }
    }
}