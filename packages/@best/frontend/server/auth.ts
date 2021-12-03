/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/
import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

const TOKEN_SECRET = process.env.TOKEN_SECRET as string;
const REVOKED_TOKENS = (process.env.REVOKED_TOKENS || "").split("\n");

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
    const token = authHeader && authHeader.split(' ')[1]

    // Send unauthorized response if token is not provided in the request
    if (token == null) {
        res.sendStatus(401);
        return;
    }

    // Block request if token has been revoked
    if (isRevoked(token)) {
        res.sendStatus(403);
        return;
    }

    jwt.verify(token, TOKEN_SECRET, (err): void => {
        // Block request if token is invalid or expired
        if (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            res.sendStatus(403);
            return;
        }

        next();
    });
}