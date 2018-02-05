const UNDERSCORE_RE = /_/g;
const VALID_NAME_RE = /^([a-zA-Z]\w*):([a-zA-Z]\w*)$/;

export function isValidName(iconName) {
    return VALID_NAME_RE.test(iconName);
}

export function getName(iconName) {
    const name = VALID_NAME_RE.exec(iconName)[2];
    return name ? name.toLowerCase() : '';
}

export function getCategory(iconName) {
    const category = VALID_NAME_RE.exec(iconName)[1];
    return category ? category.toLowerCase() : '';
}

export function computeSldsClass(iconName) {
    let className;
    if (isValidName(iconName)) {
        const name = getName(iconName).replace(UNDERSCORE_RE, '-');
        const category = getCategory(iconName);
        if (name && category) {
            className = `slds-icon-${category}-${name}`;
        }
    }
    return className || '';
}
