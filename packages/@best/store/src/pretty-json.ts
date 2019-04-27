// Taken from:
// https://github.com/lydell/json-stringify-pretty-compact

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;
const prettify = (string: string) => string.replace(stringOrChar, (match, str: string) => (str ? match : match + ' '));
const comma = (array: any[], index: number) => (index === array.length - 1 ? 0 : 1);

export function stringify(o:any = {}, { indent = "2", maxLength = 80, inlineArray = true } = {}) {
    indent = JSON.stringify([1], null, indent).slice(2, -3);
    maxLength = indent === '' ? Infinity : maxLength;

    return (function _stringify(obj, currentIndent, reserved): string {
        if (obj && typeof obj.toJSON === 'function') {
            obj = obj.toJSON();
        }

        const string = JSON.stringify(obj);

        if (string === undefined) {
            return string;
        }

        const length = maxLength - currentIndent.length - reserved;

        if (string.length <= length) {
            const prettified = prettify(string);
            if (prettified.length <= length) {
                return prettified;
            }
        }

        if (typeof obj === 'object' && obj !== null) {
            const nextIndent = currentIndent + indent;
            const items = [];
            let delimiters;

            if (Array.isArray(obj)) {
                for (let index = 0; index < obj.length; index++) {
                    items.push(_stringify(obj[index], nextIndent, comma(obj, index)) || 'null');
                }

                if (inlineArray) {
                    return '[' + items.join(', ') + ']';
                }
            } else {
                Object.keys(obj).forEach((key, index, array) => {
                    const keyPart = JSON.stringify(key) + ': ';
                    const value = _stringify(obj[key], nextIndent, keyPart.length + comma(array, index));
                    if (value !== undefined) {
                        items.push(keyPart + value);
                    }
                });
                delimiters = '{}';
            }

            if (items.length > 0 && delimiters) {
                return [delimiters[0], indent + items.join(',\n' + nextIndent), delimiters[1]].join(
                    '\n' + currentIndent,
                );
            }
        }

        return string;
    })(o, '', 0);
}
