import GitHubApi from '@octokit/rest';
declare class GitHubApp {
    id: string | undefined;
    cert: string | undefined;
    opts?: {};
    constructor(id?: string, cert?: string, opts?: {});
    authAsApp(): Promise<GitHubApi>;
    authAsInstallation(installationId: string): Promise<GitHubApi>;
    createToken(installation_id: string): Promise<any>;
}
export declare function createGithubApp(id?: string | undefined, cert?: string | undefined): GitHubApp;
export {};
