/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/*
 * This code is a slight modification of VueJS next-tick
 * https://github.com/vuejs/vue/blob/dev/src/core/util/next-tick.js
 *
 */

function isNative(Ctor: Function) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString());
}

const callbacks: Function[] = [];
let pending = false;

function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}

function handleError(e: any, ctx: any, type: any) {
    console.error(e, ctx, type);
}

let microTimerFunc: Function;
let macroTimerFunc: Function;
let useMacroTask = false;

// Determine (macro) Task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    macroTimerFunc = () => {
        setImmediate(flushCallbacks);
    };
} else if (
    typeof MessageChannel !== 'undefined' &&
    (isNative(MessageChannel) ||
        // PhantomJS
        MessageChannel.toString() === '[object MessageChannelConstructor]')
) {
    const channel = new MessageChannel();
    const port = channel.port2;
    channel.port1.onmessage = flushCallbacks;
    macroTimerFunc = () => {
        port.postMessage(1);
    };
} else {
    /* istanbul ignore next */
    macroTimerFunc = () => {
        setTimeout(flushCallbacks, 0);
    };
}

// Determine MicroTask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
    const p = Promise.resolve();
    microTimerFunc = () => {
        p.then(flushCallbacks);
    };
} else {
    // fallback to macro
    microTimerFunc = macroTimerFunc;
}

/*
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a Task instead of a MicroTask.
 */
export function withMacroTask(fn: any) {
    return (
        fn._withTask ||
        (fn._withTask = function () {
            useMacroTask = true;
            const res = fn.apply(null, arguments);
            useMacroTask = false;
            return res;
        })
    );
}

export function nextTick(cb?: any, ctx?: any) {
    let _resolve: any;

    callbacks.push(() => {
        if (cb) {
            try {
                cb.call(ctx);
            } catch (e) {
                handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(ctx);
        }
    });

    if (!pending) {
        pending = true;
        if (useMacroTask) {
            macroTimerFunc();
        } else {
            microTimerFunc();
        }
    }

    return cb
        ? null
        : new Promise((resolve) => {
              _resolve = resolve;
          });
}

export const time = window.performance.now.bind(window.performance);
export const formatTime = (t: number): number => Math.round(t * 1000) / 1000;
export const raf = window && window.requestAnimationFrame ? window.requestAnimationFrame : nextTick;
