import { isCI, isInteractive } from '../index';

test('isCI', () => {
    expect(typeof isCI).toBe('boolean');
});

test('isInteractive', () => {
    expect(typeof isInteractive).toBe('boolean');
});
