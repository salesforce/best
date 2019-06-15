
import { getGitInfo } from "../utils/git"

describe('config file resolution', () => {
    test('throw if not config is found in the directory', async () => {
        const gitInfo = await getGitInfo(process.cwd());
        expect(gitInfo).toBeDefined();
        expect(gitInfo.repo).toBeDefined();
    });
});
