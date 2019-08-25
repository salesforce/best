/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

const prism = require('prismjs');
const loadLanguages = require('prismjs/components/index');
const escapeHtml = require('escape-html');

// required to make embedded highlighting work...
loadLanguages(['markup', 'css', 'javascript']);

function wrap(code, lang) {
    if (lang === 'text') {
        code = escapeHtml(code);
    }
    return `<pre v-pre class="language-${lang}"><code>${code}</code></pre>`;
}

module.exports = (str, lang) => {
    if (!lang) {
        return wrap(str, 'text');
    }
    lang = lang.toLowerCase();
    const rawLang = lang;
    if (lang === 'html') {
        lang = 'markup';
    }

    if (lang === 'md') {
        lang = 'markdown';
    }

    if (lang === 'ts') {
        lang = 'typescript';
    }

    if (lang === 'sh') {
        lang = 'bash';
    }
    if (lang === 'yml') {
        lang = 'yaml';
    }

    if (prism.languages[lang]) {
        const code = prism.highlight(str, prism.languages[lang], lang);
        return wrap(code, rawLang);
    }

    return wrap(str, 'text');
};
