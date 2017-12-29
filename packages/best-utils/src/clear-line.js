export default (stream) => {
    if (process.stdout.isTTY) {
        stream.write('\x1b[999D\x1b[K');
    }
};
