import isCi from 'is-ci';

const isCI: boolean = isCi;
const isInteractive: boolean = Boolean(process.stdout.isTTY) && !isCI;

export {
    isCI,
    isInteractive,
};
