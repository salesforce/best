import { unwrap } from 'lwc';
import { installKeyboard, uninstallKeyboard } from './keyboard.js';

let appNavBar;         // the app-nav-bar object
let sourceIndex;       // index of element being dragged
let initialNavItems;   // navItem array as it is at the start of the drag operation
let tabsHaveMoved;     // boolean flag, false if the drag/drop operation didn't actually cause a reorder
let isTransitioning;   // boolean flag, true when navItems are animating into different position
let resetHoverStyles;  // boolean flag, we disable hover styles while dragging and re-enable afterwards
let droppedOnNavbar;   // boolean flag, if false then the drop operation occurred elsewhere in the page
let _onRenderCallback; // callback fn invoked by component's lifecycle method renderedCallback()
let itemHidden;        // item that was forced hidden during drag from More list

// css selector for the More navbar item
const moreItemSelector = 'li.more-item';
const moreButtonSelector = 'one-app-nav-bar-menu-button.more-button';

// all the events we listen to for handling the drag/drop behavior.
// note that 'dragend' does not appear here - we add that specifically to the dragged item
// during dragstart in order to account for what seems to be non-bubbling dragend events
// when canceling drag via ESC (specifically when dragging an item from the More list and
// canceling the drag while over the navbar).  anyway, listening for dragend on the dragging
// element guarantees we will hear it.
const events = ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'mousemove'];

// until raptor provides some better way for async callbacks we're using rAF
const rAF = requestAnimationFrame;

export function installDnd(navBar) {
    appNavBar = navBar;
    events.forEach(name => navBar.addEventListener(name, eventHandler));
    installKeyboard(navBar);
}

export function uninstallDnd(navBar) {
    events.forEach(name => navBar.removeEventListener(name, eventHandler));
    uninstallKeyboard(navBar);
}

export function onRender() {
    // moveTabs fn sets this after reordering tabs
    if (_onRenderCallback) {
        _onRenderCallback();
    }
}

const handlers = {
    dragstart: (e) => {
        // reset vars
        sourceIndex = undefined;
        tabsHaveMoved = false;
        droppedOnNavbar = false;

        if (e.target.dataset && e.target.dataset.id) {
            sourceIndex = getTabIndexById(e.target.dataset.id);
        }

        if (sourceIndex === undefined) {
            return;
        }

        e.target.addEventListener('dragend', eventHandler, false);

        initialNavItems = appNavBar.items.concat([]);

        e.dataTransfer.setData('text/plain', sourceIndex); // Firefox needs this
        e.dataTransfer.effectAllowed = 'move';

        if (targetElementFromMoreList(e.target)) {
            // dragging off the More list; close the menu
            const more = appNavBar.root.querySelector(moreButtonSelector);
            rAF(() => more.close());
        }

        // :hover style stays on dom element and looks weird; squash the styling until we drop
        Array.prototype.forEach.call(getNavElements(), el => el.classList.add('slds-no-hover'));
    },

    dragenter: (e) => {
        if (!appNavBar.hasNoOverflow) {
            // is the drag within the More button?
            const more = appNavBar.root.querySelector(moreItemSelector);
            if (more.contains(e.target) && !more.classList.contains('slds-is-active')) {
                more.classList.add('slds-is-active');
            }
        }
        handlers.dragover(e);
    },

    dragleave: (e) => {
        if (!appNavBar.hasNoOverflow) {
            const more = appNavBar.root.querySelector(moreItemSelector);
            if (more.contains(e.target) && !more.contains(e.relatedTarget)) {
                // are we really leaving More?  need this extra check because the
                // svg "use" tag creates shadow dom which results in false positive on
                // our e.relatedTarget check above; so we check the mouse coords to be sure
                if (e.offsetX < 0 || e.offsetX >= more.clientWidth ||
                    e.offsetY < 0 || e.offsetY >= more.clientHeight) {
                    more.classList.remove('slds-is-active');
                }
            }
        }
    },

    dragover: (e) => {
        if (e.target.nodeType !==  1) {
            return; // Firefox guard
        }

        e.preventDefault();
        e.stopPropagation();

        if (sourceIndex === undefined || isTransitioning) {
            // ignore any drags while we're transitioning two navItems into different positions
            return;
        }

        const el = getParentTab(e.target);
        if (!el) {
            return;
        }

        const targetIndex = getTabIndex(el);

        if (targetIndex === -1 || sourceIndex === targetIndex) {
            return;
        }

        const ltr = sourceIndex < targetIndex; // dragging left-to-right
        const sourceWidth = appNavBar.items[sourceIndex].width;
        const targetWidth = appNavBar.items[targetIndex].width;

        // determine threshold x-coord for when to allow the "move" operation
        const posX = e.pageX - el.offsetLeft;

        //
        // to produce the smoothest transitions, conditionally trigger a navItem move
        // when dragging based on the mouse position and the widths of the source and target elements
        //
        if ((sourceWidth > targetWidth) ||                // source is wider than target
            (ltr && posX > targetWidth - sourceWidth) ||  // left-to-right and mouse is towards right side of target
            (!ltr && posX < sourceWidth)) {               // right-to-left and mouse is towards left side of target
            moveTabs(targetIndex);
        }
    },

    drop: (e) => {
        // update our flag so dragend knows we've already handled persistence
        droppedOnNavbar = true;
        if (sourceIndex === undefined) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const el = getParentTab(e.target);
        if (!el) {
            const more = appNavBar.root.querySelector(moreItemSelector);
            if (more && more.contains(e.target)) {
                handleDropOnMore();
                more.classList.remove('slds-is-active');
            }
            return;
        }

        const targetIndex = getTabIndex(el);
        if (targetIndex === -1) {
            return;
        }

        persistChanges();
    },

    dragend: (e) => {
        e.target.removeEventListener('dragend', eventHandler, false);

        // firefox seems to like using 'move' effect even if 'drop' handler never runs :-/
        if (e.dataTransfer.dropEffect === 'none' || (e.dataTransfer.dropEffect === 'move' && !droppedOnNavbar)) {
            // drag was cancelled, or drop happened somewhere other than the navbar
            revertTabs();
        }
        resetState();
    },

    mousemove: () => {
        // this cleans up hover state which remains in the dom (on the wrong element) after a drag/drop
        if (resetHoverStyles) {
            resetHoverStyles = false;
            Array.prototype.forEach.call(getNavElements(), el => el.classList.remove('slds-no-hover'));
        }
    }
};

function eventHandler(e) {
    if (handlers[e.type]) {
        handlers[e.type](e);
    }
}

function resetState() {
    // reset flags
    sourceIndex = undefined;
    initialNavItems = undefined;
    itemHidden = undefined;
    resetHoverStyles = true;
    tabsHaveMoved = false;
}

function revertTabs() {
    if (tabsHaveMoved && initialNavItems !== undefined) {
        if (itemHidden) {
            // revert back the item we forced to be hidden
            // in order to make room for the dragging item
            itemHidden.hidden = false;
        }
        appNavBar.state.navItems = initialNavItems;
        appNavBar.updateOverflowLayout();
    }
}

function moveTabs(targetIndex) {
    if (sourceIndex === undefined || sourceIndex === targetIndex) {
        return;
    }

    const els = getNavElements();
    const sourceWidth = appNavBar.items[sourceIndex].width;
    const targetWidth = appNavBar.items[targetIndex].width;
    const sourceEl = els[sourceIndex];
    const targetEl = els[targetIndex];
    const items = appNavBar.items;
    const removed = items.splice(sourceIndex, 1)[0];
    const draggingFromMore = removed.hidden;

    // when dragging from More list hidden prop will be true; force false to ensure
    // dragged item is visible on navbar
    removed.hidden = false;
    items.splice(targetIndex, 0, removed);

    if (draggingFromMore && !tabsHaveMoved && appNavBar.state.visibleItemCount) {
        // bump last item off the navbar to make room for item being dragged
        itemHidden = items[appNavBar.state.visibleItemCount];
        itemHidden.hidden = true;
    }

    appNavBar.state.navItems = items;
    tabsHaveMoved = true;

    const oldSourceIndex = sourceIndex;
    const left = Math.min(sourceWidth, targetWidth);

    sourceIndex = targetIndex; // update the source index value because dom has changed

    _onRenderCallback = () => {
        _onRenderCallback = null;

        // at this point the tabs have swapped positions fully in the dom;
        // we immediately set the left style prop so we can animate them into position
        if (oldSourceIndex < targetIndex) {
            sourceEl.style.left = `-${left}px`;
            targetEl.style.left = `${left}px`;
        } else {
            sourceEl.style.left = `${left}px`;
            targetEl.style.left = `-${left}px`;
        }

        // force repaint by accessing offsetHeight (and force expression to keep eslint happy)
        const dummy = sourceEl.offsetHeight;
        isTransitioning = true || dummy;

        sourceEl.classList.add('transitioning');
        targetEl.classList.add('transitioning');

        rAF(() => {
            // setting left back to zero will start the animation
            resetTxFlag(sourceEl, targetEl);
            sourceEl.style.left = 0;
            targetEl.style.left = 0;
        });
    };
}

// reset isTransitioning flag once both elements have finished animating
function resetTxFlag(sourceEl, targetEl) {
    let count = 2;
    const callback = (e) => {
        if (e.propertyName === 'left') {
            e.target.removeEventListener('transitionend', callback, false);
            e.target.classList.remove('transitioning');
            if (--count === 0) {
                isTransitioning = false;
            }
        }
    };

    [sourceEl, targetEl].forEach(el => el.addEventListener('transitionend', callback, false));
}

function handleDropOnMore() {
    // move sourceIndex element to the end of the nav list
    const items = appNavBar.items;
    const removed = items.splice(sourceIndex, 1)[0];
    const selected = removed.selected;

    // if the currently selected navItem was dropped onto More then
    // update selection state.  appNavContainer will change selection to first
    // item in the navbar when it sees 'forceSelectionChange==true' in the
    // 'tabsdragged' event
    if (selected) {
        removed.selected = false;
        appNavBar.state.selectedItemId = undefined;
    }

    items.push(removed);

    appNavBar.state.navItems = items;
    tabsHaveMoved = true;
    persistChanges(selected);
}

function persistChanges(forceSelectionChange) {
    if (!tabsHaveMoved) {
        return;
    }

    // fire event for appNavContainer.cmp
    appNavBar.dispatchEvent(new CustomEvent("tabsdragged", {
        bubbles   : true,
        composed  : true,
        cancelable: true,
        detail    : {
            items: appNavBar.items.map(unwrap),
            forceSelectionChange
        }
    }));
}

// -- helpers ------------------------------------------------

function getNavElements() {
    return appNavBar.root.querySelectorAll('li[is="one-app-nav-bar-item-root"]');
}

function getLastTab() {
    const els = getNavElements();
    return els[els.length - 1];
}

function targetElementFromMoreList(el) {
    const id = el && el.dataset && el.dataset.id;
    const item = appNavBar.getNavItem(id);
    return item && item.hidden;
}

function getTabIndex(el) {
    const id = el && el.dataset && el.dataset.id;
    return getTabIndexById(id);
}

function getTabIndexById(id) {
    return appNavBar.state.navItems.findIndex(item => item.id === id);
}

function getParentTab(el) {
    if (!el || !el.classList) {
        return undefined;
    }

    if (el.classList.contains('navItem')) {
        return el;
    }
    if (el.classList.contains('navUL')) {
        return getLastTab();
    }

    el = unwrap(el);
    const els = getNavElements();
    return els.find(elem => elem.contains(el));
}

