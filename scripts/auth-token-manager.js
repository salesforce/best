/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// Borrowed from https://github.com/facebook/jest

/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const jwt = require('jsonwebtoken');
const readline = require("readline");

const rl = readline.createInterface({
     input: process.stdin,
     output: process.stdout
});

const generateNewToken = () => {
    rl.question("Who are you generating this token for? ", (user) => {
        rl.question("How long should this token last for? (e.g. '1 year', '2 days', '24 hours', '5 minutes') ", (validFor) => {
            const token = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: validFor });
            const expiration = new Date(jwt.decode(token).exp * 1000);
            console.log(`Token generated for '${user}' expires on ${expiration}:\n${token}`);
            rl.close();
        });
    });
}

const verifyToken = () => {
    rl.question("Enter token: ", (token) => {
        try {
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            const user = decoded.user;
            const issueDate = new Date(decoded.iat * 1000);
            const expirationDate = new Date(decoded.exp * 1000);
    
            console.log(`Issued to: ${user}`);
            console.log(`Issued Date: ${issueDate}`);
            console.log(`Expiration Date: ${expirationDate}`);
        } catch (e) {
            if (e instanceof jwt.TokenExpiredError) {
                console.error(`Token expired on ${e.expiredAt}`);
                process.exit(1);
            } else if (e instanceof jwt.JsonWebTokenError) {
                console.error(`Unable to parse token: ${e.message}`);
                process.exit(2);
            } else {
                process.exit(100)
            }
        } finally {
            rl.close();
        }
    });
}

rl.question("(1) Generate New Token\n(2) Verify Existing Token\n(3) Exit\n", (option) => {
    if (option === "1") {
        generateNewToken();
    } else if (option === "2") {
        verifyToken();
    } else {
        process.exit(0);
    }
});