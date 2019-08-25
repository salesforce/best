/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const fs = require('fs');
const path = require('path');

const SITE_CONFIG = require('../../config');

const PORT = process.env.PORT || 3001;
const __ENV__ = process.env.NODE_ENV || 'development';
const __PROD__ = __ENV__ === 'production';
const __WATCH__ = process.env.WATCH || false;

const DIST_DIR = path.resolve(__dirname, '../../dist');
const CONTENT_DIR = path.resolve(__dirname, '../../content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');

const BLOG_LIST = fs.readdirSync(BLOG_DIR).map(file => path.basename(file, '.md'));

// Augment the pages of the config
SITE_CONFIG.blog.pages = BLOG_LIST;

module.exports = {
    PORT,
    __ENV__,
    __PROD__,
    __WATCH__,
    DIST_DIR,
    SITE_CONFIG,
};
