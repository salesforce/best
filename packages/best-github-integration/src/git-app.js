/* eslint camelcase: 0 */
import fs from 'fs';
import jwt from 'jsonwebtoken';
import base64 from 'base-64';
import expandTilde from 'expand-tilde';
import GitHubApi from 'github';

const APP_ID = process.env.GIT_APP_ID;

/*
* NOTE: We need to do this dance to preserve breaking lines on the cert
* (INPUT) As a environment variable we store:
* cat cert.pem | base64
*
* (OUTPUT) In the CI we do:
* echo -e "$GIT_APP_CERT" | base64 -d >> ${PATH_GIT_APP_CERT}
*/

const GIT_APP_CERT_PATH = process.env.GIT_APP_CERT_PATH;
const GIT_APP_CERT_BASE64 = process.env.GIT_APP_CERT_BASE64;

const APP_CERT_BASE64 = GIT_APP_CERT_BASE64 ? (GIT_APP_CERT_BASE64[0] === '\'' ? base64.decode(GIT_APP_CERT_BASE64.slice(1, -1)) : base64.decode(GIT_APP_CERT_BASE64)) : null;
const APP_CERT = GIT_APP_CERT_PATH ? fs.readFileSync(expandTilde(GIT_APP_CERT_PATH)) : APP_CERT_BASE64;

function generateJwt(id, cert) {
    const payload = {
        iat: Math.floor(new Date() / 1000), // Issued at time
        exp: Math.floor(new Date() / 1000) - 1, // JWT expiration time
        iss: id, // Integration's GitHub id
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
        github.authenticate({
            type: 'integration',
            token: generateJwt(id, cert),
        });
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
        const response = await github.apps.createInstallationToken({
            installation_id,
        });
        return response.data.token;
    }
}

export function createGithubApp(id = APP_ID, cert = APP_CERT) {
    return new GitHubApp(id, cert);
}
