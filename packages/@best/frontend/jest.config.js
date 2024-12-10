// eslint-disable-next-line
const COMMON = require('../../../scripts/jest/common.config');

module.exports = {
    ...COMMON,
    displayName: 'frontend',
    preset: '@lwc/jest-preset',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^component-emitter$': 'component-emitter',
        '^(component|view|store)(.+)$': '<rootDir>/src/modules/$1$2$2',
    },
};
