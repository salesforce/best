const compose = require('./utilCompose');
const unescapeHtml = require('./utilUnscapeHtml');
const parseEmojis = require('./parseEmoijis');

const removeMarkdownTokens = str =>
    String(str)
        .replace(/\[(.*)\]\(.*\)/, '$1') // []()
        .replace(/(`|\*{1,3}|_)(.*?[^\\])\1/g, '$2') // `{t}` | *{t}* | **{t}** | ***{t}*** | _{t}_
        // eslint-disable-next-line no-useless-escape
        .replace(/(\\)(\*|_|`|\!)/g, '$2'); // remove escape char '\'

const trim = str => str.trim();

// Unescape html, parse emojis and remove some md tokens.
module.exports = compose(
    unescapeHtml,
    parseEmojis,
    removeMarkdownTokens,
    trim,
);
