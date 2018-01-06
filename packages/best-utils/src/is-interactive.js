import isCI from 'is-ci';

export const isInteractive = process.stdout.isTTY && !isCI;
export { isCI };
