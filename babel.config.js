module.exports = {
    presets: [
        "@babel/preset-typescript"
    ],
    plugins: [
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        "@babel/plugin-proposal-class-properties",
        "@babel/transform-modules-commonjs",
    ]
}
