/* eslint-disable no-undef */
// -- globalThis polyfill -----------------------------------------------------
(function () {
    if (typeof globalThis === 'object') return;
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Object.prototype, '__magic__', {
        get: function () {
            return this;
        },
        configurable: true,
    });
    __magic__.globalThis = __magic__;
    delete Object.prototype.__magic__;
})();

// -- https://github.com/nolanlawson/promise-worker/blob/master/register.js
function isPromise(obj) {
    // via https://unpkg.com/is-promise@2.1.0/index.js
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

function registerPromiseWorker(callback) {
    function postOutgoingMessage(e, messageId, error, result) {
        function postMessage(msg) {
            /* istanbul ignore if */
            if (typeof self.postMessage !== 'function') {
                // service worker
                e.ports[0].postMessage(msg);
            } else {
                // web worker
                self.postMessage(msg);
            }
        }
        if (error) {
            /* istanbul ignore else */
            if (typeof console !== 'undefined' && 'error' in console) {
                // This is to make errors easier to debug. I think it's important
                // enough to just leave here without giving the user an option
                // to silence it.
                // eslint-disable-next-line no-console
                console.error('Worker caught an error:', error);
            }
            postMessage([
                messageId,
                {
                    message: error.message,
                },
            ]);
        } else {
            postMessage([messageId, null, result]);
        }
    }

    function tryCatchFunc(callback, message) {
        try {
            return { res: callback(message) };
        } catch (e) {
            return { err: e };
        }
    }

    function handleIncomingMessage(e, callback, messageId, message) {
        var result = tryCatchFunc(callback, message);

        if (result.err) {
            postOutgoingMessage(e, messageId, result.err);
        } else if (!isPromise(result.res)) {
            postOutgoingMessage(e, messageId, null, result.res);
        } else {
            result.res.then(
                function (finalResult) {
                    postOutgoingMessage(e, messageId, null, finalResult);
                },
                function (finalError) {
                    postOutgoingMessage(e, messageId, finalError);
                },
            );
        }
    }

    function onIncomingMessage(e) {
        var payload = e.data;
        if (!Array.isArray(payload) || payload.length !== 2) {
            // message doens't match communication format; ignore
            return;
        }
        var messageId = payload[0];
        var message = payload[1];

        if (typeof callback !== 'function') {
            postOutgoingMessage(e, messageId, new Error('Please pass a function into register().'));
        } else {
            handleIncomingMessage(e, callback, messageId, message);
        }
    }

    self.addEventListener('message', onIncomingMessage);
}

// -- main worker code -----------------------------------------------------

importScripts('/assets/js/lwc/compiler_v100.js');
const compile = globalThis.compile;

registerPromiseWorker(async function ({ operation, options }) {
    if (operation === 'ping') {
        return 'ready';
    }

    if (operation === 'compile') {
        const { input, virtualFileSystem } = options;
        const result = await compile(input, virtualFileSystem);
        return result.output[0].code;
    }
});
