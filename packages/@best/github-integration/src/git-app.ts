/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

// -- Modules & libs --------------------------------------------------------------------
import fs from 'fs';
import https from 'https';
import expandTilde from 'expand-tilde';
import jwt from 'jsonwebtoken';
import base64 from 'base-64';
import { Octokit } from '@octokit/rest';

// -- Env & config ----------------------------------------------------------------------
const GITHUB_USER_TOKEN = process.env.GIT_USER_TOKEN;
const GITHUB_APP_ID = process.env.GIT_APP_ID;
const GITHUB_APP_CERTIFICATE_PATH = process.env.GIT_APP_CERT_PATH;
const GITHUB_APP_CERTIFICATE_BASE64 = process.env.GIT_APP_CERT_BASE64;

const GITHUB_APP_CERTIFICATE = normalizeCert({
    cert: process.env.GITHUB_APP_CERTIFICATE,
    certPath: GITHUB_APP_CERTIFICATE_PATH,
    certBase64: GITHUB_APP_CERTIFICATE_BASE64,
});

// -- Types -----------------------------------------------------------------------------
export interface GithubFactoryConfig {
    applicationId: string;
    certificate: string;
    userToken: string;
}

// -- Utils -----------------------------------------------------------------------------
function stripQuotes(str = '') {
    const q = "'";
    return str[0] === q && str[str.length - 1] === q ? str.slice(1, -1) : str;
}

function normalizeCert({
    cert,
    certPath,
    certBase64,
}: {
    cert?: string;
    certPath?: string;
    certBase64?: string;
}): string | undefined {
    return (
        cert ||
        (certPath && fs.readFileSync(expandTilde(certPath), 'utf8')) ||
        (certBase64 && base64.decode(stripQuotes(certBase64)))
    );
}

function generateJwt(id: string, cert: string) {
    const payload = {
        iat: Math.floor(+new Date() / 1000), // Issued at time
        exp: Math.floor(+new Date() / 1000) - 1, // JWT expiration time
        iss: id, // Integration's GitHub id
    };

    // Sign with RSA SHA256
    return jwt.sign(payload, cert, { algorithm: 'RS256' });
}

// -- Public API & exports --------------------------------------------------------------
class GithubFactory {
    id?: string;
    cert?: string;
    token?: string;
    gitOpts: Octokit.Options;

    constructor(
        { applicationId, certificate, userToken }: Partial<GithubFactoryConfig>,
        gitClientOpts: Octokit.Options = {},
    ) {
        if (!applicationId) {
            throw new Error('APP_ID is required');
        }

        this.id = applicationId;
        this.cert = certificate;
        this.token = userToken;
        this.gitOpts = gitClientOpts;
    }

    async authenticateAsApplication(gitOpts = this.gitOpts) {
        const { id, cert } = this;

        if (!cert || !id) {
            throw new Error('CERT and ID are required to authenticated as an App');
        }

        const token = generateJwt(id, cert);
        const github = new Octokit({
            ...gitOpts,
            auth: `Bearer ${token}`,
        });

        return github;
    }

    async authenticateAsInstallation(installationId?: number, gitOpts = this.gitOpts) {
        if (!installationId) {
            throw new Error('installationId is required to authenticate as user');
        }

        const token = await this.createInstallationToken(installationId, gitOpts);
        const github = new Octokit({
            ...gitOpts,
            auth: `token ${token}`,
        });

        return github;
    }

    async createInstallationToken(installation_id: number, gitOpts = this.gitOpts) {
        if (!installation_id) {
            throw new Error('installation_id is required to authenticate as user');
        }

        const github = await this.authenticateAsApplication(gitOpts);
        const response = await github.apps.createInstallationToken({
            installation_id,
        });

        return response.data.token;
    }

    async authenticateAsAppAndInstallation(git: { repo: string; owner: string }, gitOpts = this.gitOpts) {
        const gitAppAuth = await this.authenticateAsApplication();

        const repoInstallation = await gitAppAuth.apps.getRepoInstallation(git);
        const installationId = repoInstallation.data.id;

        return this.authenticateAsInstallation(installationId);
    }
}

export default function GithubApplicationFactory(
    { applicationId, certificate, userToken }: Partial<GithubFactoryConfig> = {
        applicationId: GITHUB_APP_ID,
        certificate: GITHUB_APP_CERTIFICATE,
        userToken: GITHUB_USER_TOKEN,
    },
    githubClientOptions: Octokit.Options = {},
) {
    const { baseUrl } = githubClientOptions;
    if (baseUrl) {
        const agent = new https.Agent();
        githubClientOptions = { agent, baseUrl };
    }

    return new GithubFactory({ applicationId, certificate, userToken }, githubClientOptions);
}
