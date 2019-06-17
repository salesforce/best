import { EOL } from "os";
export default function countEOL(buffer: string): number {
    let eol_count = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === EOL) {
            eol_count+= 1;
        }
    }

    return eol_count;
}
