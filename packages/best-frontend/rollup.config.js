/* eslint-env node */
const path = require('path');
const rollupUglify = require('rollup-plugin-uglify');
const es6Uglify = require('uglify-es');
const replace = require('rollup-plugin-replace');
const lwcCompiler = require('rollup-plugin-lwc-compiler');
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    input: path.resolve('src/main.js'),
    output: {
        file: path.resolve('public/assets/js/main.js'),
        format: 'iife',
    },
    plugins: [
        lwcCompiler({ mapNamespaceFromPath: true, resolveFromPackages: true }),
        replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
        isProduction && rollupUglify({}, es6Uglify.minify)
    ].filter(Boolean),
};
