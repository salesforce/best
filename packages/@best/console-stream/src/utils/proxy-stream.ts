export interface ProxiedStream {
    unproxyStream(): void;
    readBuffer(): string;
    clearBuffer(): void;
    writeBuffer(msg?: string): void;
}

export function proxyStream(stream: any, isInteractive: boolean): ProxiedStream {
    const _originalWrite = stream.write;
    let proxyBuffer = '';
    if (isInteractive) {
        stream.write = (msg: string) => {
            proxyBuffer += msg;
        }
    }

    return {
        unproxyStream() {
            proxyBuffer = '';
            stream.write = _originalWrite;
        },
        readBuffer() {
            return proxyBuffer;
        },
        clearBuffer() {
            proxyBuffer = '';
        },
        writeBuffer(msg: string) {
            if (msg) {
                proxyBuffer += msg;
            }
        }
    };

}
