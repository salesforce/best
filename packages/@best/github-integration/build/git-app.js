"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint camelcase: 0 */
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const base_64_1 = __importDefault(require("base-64"));
const expand_tilde_1 = __importDefault(require("expand-tilde"));
const rest_1 = __importDefault(require("@octokit/rest"));
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
const APP_CERT_BASE64 = GIT_APP_CERT_BASE64 ? (GIT_APP_CERT_BASE64[0] === '\'' ? base_64_1.default.decode(GIT_APP_CERT_BASE64.slice(1, -1)) : base_64_1.default.decode(GIT_APP_CERT_BASE64)) : undefined;
const APP_CERT = GIT_APP_CERT_PATH ? fs_1.default.readFileSync(expand_tilde_1.default(GIT_APP_CERT_PATH), 'utf8') : APP_CERT_BASE64;
function generateJwt(id, cert) {
    const payload = {
        iat: Math.floor(+new Date() / 1000),
        exp: Math.floor(+new Date() / 1000) - 1,
        iss: id,
    };
    // Sign with RSA SHA256
    return jsonwebtoken_1.default.sign(payload, cert, { algorithm: 'RS256' });
}
class GitHubApp {
    constructor(id, cert, opts = {}) {
        this.id = id;
        this.cert = cert;
        this.opts = opts;
    }
    async authAsApp() {
        const { id, cert } = this;
        const github = new rest_1.default(this.opts);
        github.authenticate({
            type: 'integration',
            token: generateJwt(id, cert),
        });
        return github;
    }
    async authAsInstallation(installationId) {
        const token = await this.createToken(installationId);
        const github = new rest_1.default(this.opts);
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
function createGithubApp(id = APP_ID, cert = APP_CERT) {
    return new GitHubApp(id, cert);
}
exports.createGithubApp = createGithubApp;
//# sourceMappingURL=git-app.js.map