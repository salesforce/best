const callbacks = [];
let pending = false;

function flushCallbacks() {
    pending = false
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}

function handleError(e, ctx, type) {
    console.error(e);
}

const p = Promise.resolve();
let microTimerFunc = () => p.then(flushCallbacks);

export function nextTick(cb, ctx) {
    let _resolve;

    callbacks.push(() => {
        if (cb) {
            try {
                cb.call(ctx)
            } catch (e) {
                handleError(e, ctx, 'nextTick')
            }
        } else if (_resolve) {
            _resolve(ctx)
        }
    });

    if (!pending) {
        pending = true
        microTimerFunc()
    }

    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(resolve => {
            _resolve = resolve
        })
    }
}
