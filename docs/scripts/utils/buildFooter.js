module.exports = function buildFooter(prev, next, { prefixUrl = '' } = {}) {
    const prevHTML = prev
        ? `<span class="prev">← <a href="${prefixUrl}/${prev.id}">${prev.title}</a></span>`
        : '';
    const nextHTML = next
        ? `<span class="next"><a href="${prefixUrl}/${next.id}">${next.title}</a> →</span>`
        : '';

    return `
        <hr>
        <div class="page-nav">
            <p class="inner">${prevHTML}${nextHTML}</p>
        </div>
    `;
};
