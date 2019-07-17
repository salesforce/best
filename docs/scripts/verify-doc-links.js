const path = require('path');
const fs = require('fs');
const http = require('http');
const markdownLinkCheck = require('markdown-link-check');
const { PORT } = require('../src/server/config');
const { DOCS_LIST, DOCS_DIR } = require('./config');
const BASE_URL = `http://localhost:${PORT}/`;

function verifyDocLinks(doc) {
    const docPath = path.join(DOCS_DIR, `${doc}.md`);
    const docSrc = fs.readFileSync(docPath, 'utf-8');
    return new Promise((resolve, reject) => {
        markdownLinkCheck(
            docSrc,
            {
                baseUrl: BASE_URL,
                // showProgressBar: true,
                replacementPatterns: [
                    {
                        // Transform relative doc links into guide links
                        pattern: '^(?!/|http|https)(.+)',
                        replacement: '/guide/$1',
                    },
                ],
            },
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    results.forEach(({ status, statusCode, link, err }) => {
                        if (statusCode !== 200 || status !== 'alive') {
                            reject(`Broken link on "${doc}" doc: ${link}(${statusCode})`);
                        }
                    });
                    resolve();
                }
            },
        );
    });
}

async function verifyAllDocLinks() {
    for (const doc of DOCS_LIST) {
        process.stdout.write(`Proccesing links on document: "${doc}"\n`);
        await verifyDocLinks(doc);
    }
}

function createServer() {
    return new Promise(async (resolve, reject) => {
        try {
            const app = await require('../src/server/server').createApp();
            const server = http.createServer(app);
            server.listen(PORT, function() {
                resolve();
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function run() {
    await createServer();
    await verifyAllDocLinks();
}

run()
    .catch(err => {
        console.log(err);
        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    });
