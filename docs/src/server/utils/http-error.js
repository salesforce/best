/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

class HTTPError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
        };
    }
}

class BadRequest extends HTTPError {
    constructor(message) {
        super(message, 400);
    }
}

class NotFound extends HTTPError {
    constructor() {
        super('Not Found', 404);
    }
}

class ServiceUnavailable extends HTTPError {
    constructor() {
        super('Service Unavailable', 503);
    }
}

module.exports = {
    HTTPError,

    BadRequest,
    NotFound,

    ServiceUnavailable,
};
