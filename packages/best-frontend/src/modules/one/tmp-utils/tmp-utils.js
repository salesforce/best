import * as icon from './icon.js';
export { icon };

export { classListMutation } from './classListMutation.js';
export { classSet } from './classSet.js';

export function joinClassNames(...names) {
    return names.reduce((classes, arg) => {
        const argType = typeof arg;
        if (argType === 'string' || argType === 'number') {
            classes.push(arg);
        } else if (Array.isArray(arg)) {
            classes.push.apply(classes, arg);
        } else if (argType === 'object') {
            for (const key in arg) {
                if (arg.hasOwnProperty(key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
        return  classes;
    }, []).join(' ');
}

// TODO this is duplication of some of the code in force:routing:RouteMapper Raptor cannot import
// aura libraries and there are challenges with importing raptor libraries into aura right now.
// When the dust settles it aura / raptor interop we should refactor to remove this duplication.
export function isPureLeftClick(event) {
    let isLeft = true;

    event = event || {};

    if (event.which > 1) {
        isLeft = false;
    }

    if (isLeft) {
        isLeft = !(event.altKey || event.ctrlKey  || event.shiftKey || event.metaKey);
    }

    return isLeft;
}
