/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

import { Writable } from "stream";
import { isInteractive as globaIsInteractive, clearLine } from "@best/utils";
import { EOL } from "os";

function countEOL(buffer: string): number {
    let eol_count = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === EOL) {
            eol_count+= 1;
        }
    }

    return eol_count;
}

export default class OutputStream {
    stdout: Writable;
    isInteractive: boolean;
    _linesBuffer: number = 0;

    constructor(stream: Writable, isInteractive?: boolean) {
        this.stdout = stream;
        this.isInteractive = isInteractive || globaIsInteractive
    }

    write(str: string) {
        this._linesBuffer += countEOL(str);
        this.stdout.write(str);
    }
    writeln(str: string) {
        this.write(str + '\n');
    }

    clearLine() {
        if (this.isInteractive) {
            clearLine(this.stdout);
        }
    }

    clearAll() {
        if (this.isInteractive) {
            clearLine(this.stdout);
            this.stdout.write('\r\x1B[K\r\x1B[1A'.repeat(this._linesBuffer));
            this.reset();
        }
    }

    reset() {
        this._linesBuffer = 0;
    }
}
