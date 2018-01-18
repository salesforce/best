/* eslint-env node */
const path = require('path');
const replace = require('rollup-plugin-replace');
const lwcCompiler = require('rollup-plugin-lwc-compiler');

const isProduction = process.env.NODE_ENV === 'production';
const fileName = `main${isProduction ? '.min' : ''}.js`;

const plugins = [
    lwcCompiler({ resolveFromPackages: true }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
];

// if (isProduction) {
//     plugins.push(rollupUglify(
//         { warnings: false },
//         es6Uglify.minify
//     ));
// }

module.exports = {
    input: path.resolve(__dirname, '../src/main.js'),
    output: {
        file: path.resolve(__dirname, `../public/js/${fileName}`),
        format: 'iife',
    },
    plugins
};
