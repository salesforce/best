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
