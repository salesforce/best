import fs from 'fs';
import path from 'path';
import comparison1 from './fixtures/comparison1';
import { generateComparisonComment } from '../../src/comment';

describe('generateComment', () => {
    test('fixtures/comparison1.js', () => {
        const { baseCommit, targetCommit, stats } = comparison1;
        const actual = generateComparisonComment(baseCommit, targetCommit, stats);
        const expected = fs.readFileSync(path.resolve(__dirname, 'fixtures/expected1.md'), 'utf8');
        expect(actual.trim()).toEqual(expected.trim());
    });
});
