// Copied from https://github.com/vuepress/vuepress-plugin-container/blob/master/src/index.js
const container = require('markdown-it-container');

function call(target, ...args) {
    if (typeof target === 'function') {
        return target(...args);
    } else {
        return target;
    }
}

function extendMarkdown(md, options) {
    const {
        validate,
        marker,
        before,
        after,
        type = '',
        defaultTitle = type.toUpperCase(),
    } = options;

    let { render } = options;
    if (!render) {
        if (before !== undefined && after !== undefined) {
            render = (tokens, index) => {
                const info = tokens[index].info
                    .trim()
                    .slice(type.length)
                    .trim();
                return tokens[index].nesting === 1 ? call(before, info) : call(after, info);
            };
        } else {
            render = (tokens, index, _, env) => {
                const token = tokens[index];
                const { relativePath = '' } = env;
                let title = token.info
                    .trim()
                    .slice(type.length)
                    .trim();
                if (!title && defaultTitle) {
                    if (typeof defaultTitle === 'string') {
                        title = defaultTitle;
                    } else if (typeof defaultTitle === 'object') {
                        for (const path in defaultTitle) {
                            if (relativePath.startsWith(path.replace(/^\//, ''))) {
                                title = defaultTitle[path];
                                if (path !== '/') break;
                            }
                        }
                    }
                }
                if (title) title = `<p class="custom-block-title">${title}</p>`;
                if (token.nesting === 1) {
                    return `<div class="${type} custom-block">${title}\n`;
                } else {
                    return '</div>\n';
                }
            };
        }
    }

    md.use(container, type, { render, validate, marker });
}

module.exports = (md, options) => {
    if (options && options.length) {
        options.forEach(opt => extendMarkdown(md, opt));
    }
};
