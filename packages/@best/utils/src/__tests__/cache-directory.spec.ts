import { cacheDirectory } from '../index';

test('returns a cache directory path', () => {
    const path = cacheDirectory();

    expect(typeof path).toBe('string');
    expect(path).toMatch(/best/);
});

test('returns the same cache directory for each call', () => {
    expect(cacheDirectory()).toBe(cacheDirectory());
});

test('cache directory name override', () => {
    const name = 'test';
    const path = cacheDirectory(name);

    expect(path).toMatch(name);
});
