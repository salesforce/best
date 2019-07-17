const fs = require('fs');
const path = require('path');
const { NotFound } = require('./http-error');

/*
 * Caches in memory all of the doc pages and send them as a buffer when requested
 */
module.exports = function(pages, dist, { prod, prefix = '', alias = {} } = {}) {
    if (prod) {
        const PAGES = new Map();
        // eslint-disable-next-line no-console
        console.log(`[page-caching] - Storing ${pages.length} elements`);
        pages.forEach(doc => {
            const pageSource = fs.readFileSync(path.join(dist, `${prefix}${doc}.html`));
            PAGES.set(prefix + doc, pageSource);
        });

        return function cache(req, res, next) {
            const page = prefix + (req.params.page || req.path);
            const pageSource = PAGES.get(page) || PAGES.get(alias[page]);

            if (pageSource) {
                res.type('html');
                res.set('Cache-Control', 'public, max-age=600'); // cache for 10 minutes
                res.send(Buffer.from(pageSource));
            } else {
                next(new NotFound());
            }
        };
    } else {
        return function noop_cache(req, res, next) {
            next();
        };
    }
};
