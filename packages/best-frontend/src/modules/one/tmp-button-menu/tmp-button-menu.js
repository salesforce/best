import { LightningElement, unwrap, api, track } from 'engine';
import { joinClassNames } from "one-tmp-utils";
import { handleKeyDownOnMenuItem, handleKeyDownOnMenuTrigger } from "./keyboard.js";

// XXX: HACK, component name hard coded, will break on renames
const menuItemTagName = "one-tmp-menu-item";

export default class LightningButtonMenu extends LightningElement {
    @track state = {
        dropdownVisible: false,
        dropdownOpened : false
    };

    @api menuAlignment = "left";
    @api iconName = "utility:down";
    @api value = "";
    @api disabled = false;
    @api nubbin = false;
    @api isMore = false;
    @api label;
    @api alternativeText;
    @api size;
    @api unsaved;

    constructor() {
        super();

        this.keyboardInterface = this.menuKeyboardInterface();
        this.classList.add("slds-dropdown-trigger", "slds-dropdown-trigger--click");
    }

    get tabIndex() {
        return this.disabled ? -1 : 0;
    }

    get buttonClass() {
        return joinClassNames("slds-button", "slds-button_reset", {
            "slds-context-bar__label-action": this.isMore
        });
    }

    get showDownIcon() {
        return !(this.iconName === "utility:down" || this.iconName === "utility:chevrondown");
    }

    get iconClass() {
        return joinClassNames("slds-button__icon", { "slds-button__icon--right": this.label != null });
    }

    get dropdownClass() {
        const sizeClass = this.size && this.size.length > 0 ? "slds-dropdown_" + this.size : null;
        return joinClassNames("slds-dropdown", sizeClass, {
            "slds-dropdown--length-with-icon-10"                                    : this.isMore,
            "slds-dropdown--left"                                                   : this.menuAlignment === "left",
            "slds-dropdown--center"                                                 : this.menuAlignment === "center",
            "slds-dropdown--right"                                                  : this.menuAlignment === "right",
            "slds-dropdown--bottom"                                                 : this.menuAlignment === "bottom-center",
            "slds-dropdown--bottom slds-dropdown--right slds-dropdown--bottom-right": this.menuAlignment === "bottom-right",
            "slds-dropdown--bottom slds-dropdown--left slds-dropdown--bottom-left"  : this.menuAlignment === "bottom-left",
            "slds-nubbin--top-left"                                                 : this.nubbin && this.menuAlignment === "left",
            "slds-nubbin--top-right"                                                : this.nubbin && this.menuAlignment === "right",
            "slds-nubbin--top"                                                      : this.nubbin && this.menuAlignment === "center",
            "slds-nubbin--bottom-left"                                              : this.nubbin && this.menuAlignment === "bottom-left",
            "slds-nubbin--bottom-right"                                             : this.nubbin && this.menuAlignment === "bottom-right",
            "slds-nubbin--bottom"                                                   : this.nubbin && this.menuAlignment === "bottom-center"
        });
    }

    get ariaExpanded() {
        return this.state.dropdownVisible ? "true" : "false";
    }

    handleMenuItemSelect() {
        if (this.state.dropdownVisible) {
            this.toggleMenuVisibility();
            this.focusOnButton();
        }
    }

    handleButtonClick() {
        this.allowBlur();

        this.toggleMenuVisibility();

        // Focus on the button even if the browser doesn't do it by default
        // (the behaviour differs between Chrome, Safari, Firefox)
        this.focusOnButton();
    }

    handleButtonKeyDown(event) {
        handleKeyDownOnMenuTrigger(event, this.keyboardInterface);
    }

    handleButtonMouseDown(event) {
        const mainButton = 0;
        if (event.button === mainButton) {
            this.cancelBlur();
        }
    }

    focusOnButton() {
        this.root.querySelector("button").focus();
    }

    toggleMenuVisibility() {
        if (!this.disabled) {
            this.state.dropdownVisible = !this.state.dropdownVisible;
            if (!this.state.dropdownOpened && this.state.dropdownVisible) {
                this.state.dropdownOpened = true;
            }
            if (this.state.dropdownVisible) {
                // TODO: Think this one through, should we instead open menu
                // on focus and rely on "onfocus" ?

                this.dispatchEvent(new CustomEvent("open"));
            }

            this.classList.toggle("slds-is-open");
        }
    }

    getMenuItems() {
        // Get children (HTMLCollection) and transform into an array.
        return this.querySelectorAll(menuItemTagName);
    }

    getMenuItemByIndex(index) {
        return this.getMenuItems()[index];
    }

    findMenuItemIndex(menuItemElement) {
        // Get children (HTMLCollection) and transform into an array.
        const listChildren = Array.prototype.slice.call(this.getMenuItems());

        for (let i = 0; i < listChildren.length; i++) {
            if (unwrap(listChildren[i]) === menuItemElement) {
                return i;
            }
        }

        return -1;
    }

    findMenuItemFromEventTarget(element) {
        let currentNode = element;
        while (currentNode !== this) {
            if (currentNode.nodeName.toLowerCase() === menuItemTagName) {
                return currentNode;
            }
            if (currentNode.parentNode) {
                currentNode = currentNode.parentNode;
            } else {
                return null;
            }
        }
        return null;
    }

    handleKeyOnMenuItem(event) {
        const menuItem = this.findMenuItemFromEventTarget(event.target);
        if (menuItem) {
            handleKeyDownOnMenuItem(event, this.findMenuItemIndex(menuItem), this.keyboardInterface);
        }
    }

    handleMouseOverOnMenuItem(event) {
        const menuItem = this.findMenuItemFromEventTarget(event.target);
        if (menuItem) {
            this.cancelBlurAndFocusOnMenuItem(menuItem);
        } else {
            // We have to handle cancelling blur for IE
            // Because when scrollbars are present, IE will trigger
            // a blur event before mouse out
            this.cancelBlur();
        }
    }

    cancelBlurAndFocusOnMenuItem(menuItem) {
        this.cancelBlur();
        if (menuItem) {
            menuItem.focus();
        }
    }

    handleFocus() {
        this.dispatchEvent(new CustomEvent("focus"));
    }

    handleBlur(event) {
        // The event may be synthetic from the menu items
        event.stopPropagation();

        // Don't handle the blur event if the focus events are inside the menu (see the cancelBlur/allowBlur functions)
        if (this._cancelBlur) {
            return;
        }
        // Hide only when the focus moved away from the container
        if (this.state.dropdownVisible) {
            this.toggleMenuVisibility();
        }

        this.dispatchEvent(new CustomEvent("blur"));
    }

    allowBlur() {
        this._cancelBlur = false;
    }

    cancelBlur() {
        this._cancelBlur = true;
    }

    // TODO: Could likely be made nicer with ES6
    menuKeyboardInterface() {
        const that = this;
        return {
            getTotalMenuItems() {
                return that.getMenuItems().length;
            },
            focusOnIndex(index) {
                that.cancelBlurAndFocusOnMenuItem(that.getMenuItemByIndex(index));
            },
            returnFocus() {
                that.focusOnButton();
            },
            isMenuVisible() {
                return that.state.dropdownVisible;
            },
            toggleMenuVisibility() {
                that.toggleMenuVisibility();
            },
            focusMenuItemWithText(text) {
                const match = Array.prototype.slice.call(that.getMenuItems()).filter(menuItem => {
                    const label = menuItem.label;
                    return label && label.toLowerCase().indexOf(text) === 0;
                });
                if (match.length > 0) {
                    that.cancelBlurAndFocusOnMenuItem(match[0]);
                }
            }
        };
    }
}
