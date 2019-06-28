// eslint-disable-next-line @typescript-eslint/no-var-requires
const COMMON = require('../../../scripts/jest/common.config')

module.exports = {
    ...COMMON,
    displayName: 'frontend',
    preset: '@lwc/jest-preset',
    moduleNameMapper: {
        "^component-emitter$": "component-emitter",
        "^(component|my|view|store)(.+)$": "<rootDir>/src/modules/$1$2$2"
    }
}