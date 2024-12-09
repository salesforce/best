const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LwcWebpackPlugin = require('lwc-webpack-plugin');
const webpack = require('webpack');

const mode = process.env.NODE_ENV || 'production';

module.exports = {
    entry: [path.join(__dirname, './src/client/index.js')],
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
            modules: [{ dir: path.join(__dirname, './src/client/modules/') }],
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './src/client/index.html'),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src/client/resources/'),
                    to: path.join(__dirname, 'dist/resources/'),
                },
            ],
        }),
    ],
};
