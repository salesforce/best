/*
 * This is following the practices listed in
 *
 * https://www.w3.org/TR/wai-aria-practices/#menu
 *
 * and
 *
 * https://www.w3.org/TR/wai-aria-practices/#menubutton
 */

const keyCodes = {
    tab   : 9,
    enter : 13,
    escape: 27,
    space : 32,
    end   : 35,
    home  : 36,
    left  : 37,
    up    : 38,
    right : 39,
    down  : 40
};

function preventDefaultAndStopPropagation(event) {
    event.preventDefault();
    event.stopPropagation();
}

function hasModifierKey(event) {
    return event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;
}

const buffer = {};

function moveFocusToTypedCharacters(event, menuInterface) {
    // If we were going to clear what keys were typed, don't yet.
    if (buffer._clearBufferId) {
        clearTimeout(buffer._clearBufferId);
    }

    // Store the letter.
    const letter = String.fromCharCode(event.keyCode);
    buffer._keyBuffer = buffer._keyBuffer || [];
    buffer._keyBuffer.push(letter);

    // Try to select
    const matchText = buffer._keyBuffer.join("").toLowerCase();
    menuInterface.focusMenuItemWithText(matchText);
    buffer._clearBufferId = setTimeout(() => {
        buffer._keyBuffer = [];
    }, 700);
}

export function handleKeyDownOnMenuItem(event, menuItemIndex, menuInterface) {
    if (hasModifierKey(event)) {
        return;
    }
    switch (event.keyCode) {
        // W3: Down Arrow and Up Arrow: move focus to the next and previous items, respectively, optionally
        // wrapping from last to first and vice versa.
        case keyCodes.down:
        case keyCodes.up: {
            preventDefaultAndStopPropagation(event);
            let nextIndex = event.keyCode === keyCodes.up ? menuItemIndex - 1 : menuItemIndex + 1;
            if (nextIndex >= menuInterface.getTotalMenuItems()) {
                nextIndex = 0;
            } else if (nextIndex < 0) {
                nextIndex = menuInterface.getTotalMenuItems() - 1;
            }
            menuInterface.focusOnIndex(nextIndex);
            break;
        }
        // W3: Home and End: If arrow key wrapping is not supported, move focus to first and last item
        // Note: We do support wrapping, but it doesn't hurt to support these keys anyway.
        case keyCodes.home:
            preventDefaultAndStopPropagation(event);
            menuInterface.focusOnIndex(0);
            break;
        case keyCodes.end:
            preventDefaultAndStopPropagation(event);
            menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
            break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened
        // Tab: Close the menu and all open parent menus and move focus to the next element in the tab sequence.
        // Note: We don't have to do anything special for Tab because we're not stopping the event, we'll first
        // return the focus and the browser will then handle the tab key default event and will move the focus
        // appropriately. It's handy to return focus for 'Tab' anyway for cases where the menu is in a detached
        // popup (one that's using a panel attached directly to the body).
        case keyCodes.escape:
        case keyCodes.tab:
            if (menuInterface.isMenuVisible()) {
                menuInterface.toggleMenuVisibility();
            }
            menuInterface.returnFocus();
            break;
        default:
            // W3: Any key that corresponds to a printable character: Move focus to the next menu item in the
            // current menu whose label begins with that printable character.
            // Note: we actually support a buffer, and in the current implementation it would jump to
            // the first menu item that matches not next.
            moveFocusToTypedCharacters(event, menuInterface);
    }
}

export function handleKeyDownOnMenuTrigger(event, menuInterface) {
    if (hasModifierKey(event)) {
        return;
    }
    const isVisible = menuInterface.isMenuVisible();
    switch (event.keyCode) {
        // W3 suggests that opening a menu should place the focus on the first item (as we do with Up/Down),
        // but we're not doing that because it would differ from most of the native menus behaviour.
        case keyCodes.enter:
        case keyCodes.space:
            preventDefaultAndStopPropagation(event);
            menuInterface.toggleMenuVisibility();
            break;
        case keyCodes.down:
        case keyCodes.up:
            preventDefaultAndStopPropagation(event);
            if (!isVisible) {
                menuInterface.toggleMenuVisibility();
            }
            // XXX: This won't work if the menu is lazy loaded and
            // takes while to load the items (e.g. if loading from
            // the server

            // eslint-disable-next-line lwc/no-raf
            window.requestAnimationFrame(() => {
                let focusOnIndex = 0;
                if (event.keyCode === keyCodes.up) {
                    focusOnIndex = menuInterface.getTotalMenuItems() - 1;
                }
                if (focusOnIndex >= 0) {
                    menuInterface.focusOnIndex(focusOnIndex);
                }
            });
            break;
        // W3: Home and End: If arrow key wrapping is not supported, move focus to first and last item
        // Note: We do support wrapping, but it doesn't hurt to support these keys anyway.
        case keyCodes.home:
            preventDefaultAndStopPropagation(event);
            menuInterface.focusOnIndex(0);
            break;
        case keyCodes.end:
            preventDefaultAndStopPropagation(event);
            menuInterface.focusOnIndex(menuInterface.getTotalMenuItems() - 1);
            break;
        // W3: Escape: Close the menu and return focus to the element or context, e.g., menu button or
        // parent menu item, from which the menu was opened
        case keyCodes.escape:
        case keyCodes.tab:
            if (isVisible) {
                menuInterface.toggleMenuVisibility();
            }
            break;
        default:
            if (!isVisible && menuInterface.showDropdownWhenTypingCharacters) {
                menuInterface.toggleMenuVisibility();
            } else if (!isVisible) {
                break;
            }
            // eslint-disable-next-line lwc/no-raf
            window.requestAnimationFrame(() => {
                moveFocusToTypedCharacters(event, menuInterface);
            });
    }
}
