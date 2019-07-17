/*
This is an example of expected markup:

<ul class="nav__list">
        <li>
            <input id="group-1" type="checkbox" hidden />
            <label for="group-1"><span class="fa fa-angle-right"></span> First level</label>
            <ul class="group-list">
                <li><a href="#">1st level item</a></li>
                <li>
                    <input id="sub-group-1" type="checkbox" hidden />
                    <label for="sub-group-1"><span class="fa fa-angle-right"></span> Second level</label>
                    <ul class="sub-group-list">
                        <li><a href="#">2nd level nav item</a></li>
                        <li><a href="#">2nd level nav item</a></li>
                        <li><a href="#">2nd level nav item</a></li>
                        <li>
                            <input id="sub-sub-group-1" type="checkbox" hidden />
                            <label for="sub-sub-group-1"><span class="fa fa-angle-right"></span> Third
                                level</label>
                            <ul class="sub-sub-group-list">
                                <li><a href="#">3rd level nav item</a></li>
                                <li><a href="#">3rd level nav item</a></li>
                                <li><a href="#">3rd level nav item</a></li>
                            </ul>
                        </li>
                    </ul>
                </li>
            </ul>
        </li>
*/

function buildSidebarChildren(children, currentLevel = 2) {
    let tmp = '';
    if (children && children.length) {
        tmp = children.reduce((buffer, item) => {
            const { level, title, slug } = item;
            if (level > currentLevel) {
                buffer += '<ul class="sub-group-list">\n';
            }

            if (level < currentLevel) {
                buffer += '</ul>\n'.repeat(currentLevel - level);
            }

            currentLevel = level;
            buffer += `<li><a href="#${slug}">${title}</a></li>\n`;

            return buffer;
        }, '<ul class="group-list">\n');

        tmp += '</ul>';
    }

    return tmp;
}

function buildSidebar(sidebarData, { prefixUrl = '' } = {}) {
    const content = sidebarData
        .map(
            ({ id, title, children, isSelected }) =>
                `<li ${isSelected ? 'class="active"' : ''}>
                    <input id="${id}" type="checkbox" ${isSelected ? 'checked' : ''} hidden="">
                    <label for="${id}"><span class="icon-angle"></span><a href="${prefixUrl}/${id}">${title}</a></label>
                    ${buildSidebarChildren(children)}
                </li>`,
        )
        .join('');

    return `<nav class="nav" role="navigation" id="nav">
                <ul class="nav__list">${content}</ul>
            </nav>
    `;
}

module.exports = buildSidebar;
