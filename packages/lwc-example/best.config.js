module.exports = {
    projectName: 'lwc-example',
    plugins: [
        ['@lwc/rollup-plugin', {
            rootDir: '<rootDir>/src/'
        }],
        ['rollup-plugin-replace', { 'process.env.NODE_ENV': JSON.stringify('production') }]
    ]
};
