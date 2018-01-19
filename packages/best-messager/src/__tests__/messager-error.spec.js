import { PassThrough } from 'stream';
import { errorMessager } from '../index';

const MSG = 'I am an error';
const { stack } = new Error(MSG);

test('print error in passed stream', () => {
    const stream = new PassThrough();
    errorMessager.print(MSG, stack, stream);

    const message = stream.read().toString();
    expect(message).toMatch(MSG);
    expect(message).toMatch(stack);
});

test('print error on process.stdout', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});

    errorMessager.print(MSG, stack);

    expect(spy).toHaveBeenCalled();

    spy.mockReset();
    spy.mockRestore();
});
