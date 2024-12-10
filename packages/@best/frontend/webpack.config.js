/* eslint-disable */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LwcWebpackPlugin = require('lwc-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
/* eslint-enable */

const mode = process.env.NODE_ENV || 'production';

module.exports = {
    entry: [path.join(__dirname, './src/index.js')],
    mode,
    devtool: mode === 'development',
    output: {
        path: path.join(__dirname, './dist'),
        filename: '[name]-app.js',
        publicPath: '/',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(mode),
        }),
        new LwcWebpackPlugin({
            modules: [{ dir: path.join(__dirname, './src/modules/') }],
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './src/index.html'),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src/resources/'),
                    to: path.join(__dirname, 'dist/resources/'),
                },
                {
                    from: path.join(__dirname, '../../../node_modules/plotly.js-basic-dist-min/plotly-basic.min.js'),
                    to: path.join(__dirname, 'dist/plotly.min.js'),
                },
            ],
        }),
    ],
};
