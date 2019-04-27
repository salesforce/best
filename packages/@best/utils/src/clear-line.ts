import { Writable } from 'stream';

export default function clearLine(stream: Writable): void {
    if (process.stdout.isTTY) {
        stream.write('\x1b[999D\x1b[K');
    }
}
