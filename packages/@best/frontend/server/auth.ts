/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const TOKEN_SECRET = process.env.TOKEN_SECRET as string;
const REVOKED_TOKENS = (process.env.REVOKED_TOKENS || '').split('\n');

/**
 * Checks if the provided token has been revoked based on the revocation list provided
 * in process.env.REVOKED_TOKENS environmental variable
 * @param token The token to check if it has been revoked.
 * @returns true if token is revoked, otherwise false
 */
function isRevoked(token: string): boolean {
    return REVOKED_TOKENS.includes(token);
}

/**
 * Function that verifies the token provided in the request header
 * and on successful authorization it will call the next function on the chain.
 * The secret token must be provided via process.env.TOKEN_SECRET
 */
export function authorizeRequest(req: Request, res: Response, next: NextFunction): void {
    const { authorization: authHeader } = req.headers;

    // Send unauthorized response if token is not provided in the request
    if (authHeader == null) {
        res.status(401).send('Unauthorized: You must provide your token in authorization header.');
        return;
    }

    const authHeaderParts = authHeader.split(' ');
    if (authHeaderParts.length !== 2 || authHeaderParts[0] !== 'Bearer') {
        res.status(401).send('Unauthorized: Unrecognized authorization header format. Accepted format: Bearer <token>');
        return;
    }

    // Second part of the auth header value is the actual token.
    // Example header: "Authorization: Bearer this_is_my_token"
    const token = authHeaderParts[1];

    // Use last 6 chars to identify the token
    const partialToken = token.slice(-6);

    // Block request if token has been revoked
    if (isRevoked(token)) {
        res.status(403).send('Forbidden: Your token has been revoked.');
        return;
    }

    jwt.verify(token, TOKEN_SECRET, (err): void => {
        // Block request if token is invalid or expired
        if (err) {
            // eslint-disable-next-line no-console
            console.error(`Error while authorizing request using token ending in '${partialToken}'. ${err}`);

            // Always send with status 403 Forbidden
            res.status(403);

            // Respond back with specific reasons for denial if reason is known.
            if (err instanceof jwt.TokenExpiredError) {
                res.send(`Token ending in '${partialToken}' expired on ${err.expiredAt}`);
            } else if (err instanceof jwt.JsonWebTokenError) {
                res.send(`Token ending in '${partialToken}' cannot be parsed. Error: ${err.message}`);
            } else {
                res.send(`Error while authorizing request with token ending in '${partialToken}': ${err}`);
            }

            return;
        }

        next();
    });
}
