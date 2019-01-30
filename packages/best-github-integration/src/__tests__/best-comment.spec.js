import comparison1 from './fixtures/comparison1';
import { generateComparisonComment } from '../../src/comment';
import fs from 'fs';
import path from 'path';

describe('generateComment', () => {
    test('fail', () => {
        const { baseCommit, targetCommit, stats } = comparison1;
        const actual = generateComparisonComment(baseCommit, targetCommit, stats);
        const expected = fs.readFileSync(path.resolve(__dirname, 'fixtures/expected1.md'), 'utf8');
        expect(actual.trim()).toEqual(expected.trim());
    });
});
