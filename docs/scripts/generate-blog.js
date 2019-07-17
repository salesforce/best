/* eslint-disable no-console */
const buildBlog = require('./build-blog');

buildBlog().catch(err => {
    console.log(err);
    throw err;
});
