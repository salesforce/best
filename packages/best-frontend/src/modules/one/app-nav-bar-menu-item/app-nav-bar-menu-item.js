import { api, Element } from "engine";
import { joinClassNames, isPureLeftClick } from "one-tmp-utils";

export default class LightningMenuItem extends Element {
    // eslint-disable-next-line no-script-url
    @api url = "javascript:void(0)";
    @api value;
    @api disabled;
    @api label;
    @api iconName;
    @api leftIconName;
    @api checked;
    @api actionId;
    @api className;
    @api unsaved;

    connectedCallback() {
        this.classList.add("slds-dropdown__item");
    }

    get i18n() {
        return Labels;
    }

    get role() {
        return this.checked == null ? "menuitem" : "menuitemcheckbox";
    }

    get classNames() {
        return joinClassNames("slds-dropdown__item", {"slds-is-selected": this.checked === "true"});
    }

    get leftIconClassNames() {
        return joinClassNames("slds-icon-text-default slds-m-right--x-small slds-shrink-none",
            {"slds-icon--selected": this.checked != null});
    }

    get computedLeftIconName() {
        return this.checked == null ? this.leftIconName : "utility:check";
    }

    handleBlur() {
        this.dispatchEvent(new CustomEvent("blur", { bubbles: true, composed: true, cancelable: true }));
    }

    select(e) {
        if (!this.disabled && isPureLeftClick(e)) {
            this.dispatchEvent(new CustomEvent("select", {
                bubbles   : true,
                composed  : true,
                cancelable: true,
                detail    : {
                    actionId: this.actionId
                }
            }));
        }
    }

    @api
    focus() {
        this.root.querySelector("a").focus();
    }
}
