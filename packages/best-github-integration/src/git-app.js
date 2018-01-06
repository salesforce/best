/* eslint camelcase: 0 */
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import GitHubApi from "github";

const APP_ID = process.env.GIT_APP_ID;
const PATH_GIT_APP_CERT = process.env.PATH_GIT_APP_CERT;
const APP_CERT = PATH_GIT_APP_CERT ? fs.readFileSync(path.resolve(PATH_GIT_APP_CERT)) : null;

function generateJwt(id, cert) {
    const payload = {
        iat: Math.floor(new Date() / 1000),       // Issued at time
        exp: Math.floor(new Date() / 1000) + 60,  // JWT expiration time
        iss: id                                   // Integration's GitHub id
    };

    // Sign with RSA SHA256
    return jwt.sign(payload, cert, { algorithm: 'RS256' });
}

class GitHubApp {
    constructor(id, cert, opts = {}) {
        this.id = id;
        this.cert = cert;
        this.opts = opts;
    }

    async authAsApp() {
        const { id, cert } = this;
        const github = new GitHubApi(this.opts);
        github.authenticate({ type: 'integration', token: generateJwt(id, cert) });
        return github;
    }

    async authAsInstallation(installationId) {
        const token = await this.createToken(installationId);
        const github = new GitHubApi(this.opts);
        github.authenticate({ type: 'token', token });
        return github;
    }

    async createToken(installation_id) {
        const github = await this.authAsApp();
        const response = await github.apps.createInstallationToken({ installation_id });
        return response.data.token;
    }
}

export function createGithubApp(id = APP_ID, cert = APP_CERT) {
    return new GitHubApp(id, cert);
}
