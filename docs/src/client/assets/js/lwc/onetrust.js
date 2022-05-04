/*globals console */
/* eslint-disable */
var SfdcWwwBase = SfdcWwwBase || {};

var oneTrustComponent = (function () {
    'use strict';

    // oneTrustContainer gets set in waitForOneTrustContainer()
    var oneTrustContainer,
        count = 0;
    var Keyboard = {
        TAB: 9,
        ESCAPE: 27,
        ENTER: 13,
        SPACE: 32,
        LEFT: 37,
        RIGHT: 39,
    };

    function changeButtons() {
        var categoryItems =
            oneTrustContainer && oneTrustContainer.querySelectorAll('.category-menu-switch-handler')
                ? oneTrustContainer.querySelectorAll('.category-menu-switch-handler')
                : false;
        var saveCookiesButton =
            oneTrustContainer && oneTrustContainer.querySelector('.save-preference-btn-handler')
                ? oneTrustContainer.querySelector('.save-preference-btn-handler')
                : false;
        var acceptCookiesButton =
            oneTrustContainer && oneTrustContainer.querySelector('#accept-recommended-btn-handler')
                ? oneTrustContainer.querySelector('#accept-recommended-btn-handler')
                : false;
        var generalContentArea =
            oneTrustContainer && oneTrustContainer.querySelector('#ot-tab-desc')
                ? oneTrustContainer.querySelector('#ot-tab-desc')
                : false;

        // Update backbutton in cookie list to move span inside of button
        var listSection =
            oneTrustContainer && oneTrustContainer.querySelector('#ot-pc-lst')
                ? oneTrustContainer.querySelector('#ot-pc-lst')
                : false;
        var headingSection =
            listSection && listSection.querySelector('#ot-lst-title')
                ? listSection.querySelector('#ot-lst-title')
                : false;
        var backButton =
            headingSection && headingSection.querySelector('.back-btn-handler')
                ? headingSection.querySelector('.back-btn-handler')
                : false;
        var headingSecSpan =
            headingSection && headingSection.getElementsByTagName('span')
                ? headingSection.getElementsByTagName('span')
                : false;

        // Move span inside of button so all can be selected or clicked, not just tiny arrow
        if (backButton && headingSecSpan) backButton.appendChild(headingSecSpan[0]);

        // Setup button toggles to show/hide save all button
        function toggleButtons(categoryItem) {
            if (saveCookiesButton && acceptCookiesButton) {
                if (typeof categoryItem.parentElement.dataset.optanongroupid === 'undefined') {
                    if (saveCookiesButton.classList.contains('visible')) saveCookiesButton.classList.remove('visible');
                    if (acceptCookiesButton.classList.contains('optanon-ghost-button'))
                        acceptCookiesButton.classList.remove('optanon-ghost-button');
                } else {
                    saveCookiesButton.classList.add('visible');
                    acceptCookiesButton.classList.add('optanon-ghost-button');
                }
            }
        }

        // Loop over links to add click and keydown events to call toggleButtons()
        for (let i = 0; i < categoryItems.length; i++) {
            // Click events
            categoryItems[i].addEventListener('click', function (e) {
                toggleButtons(e.currentTarget);
            });

            // Add keyboard navigation event to toggle buttons
            categoryItems[i].addEventListener('keydown', function (e) {
                // Arrow keys - left and right
                if (e.keyCode === Keyboard.LEFT || e.keyCode === Keyboard.RIGHT) toggleArrowKeyDirection();
            });
        }

        // OneTrust tool not fully accessible. Needs a little help with tab key and shift + tab keys
        if (generalContentArea && saveCookiesButton && acceptCookiesButton && categoryItems.length) {
            for (let i = 0; i < categoryItems.length; i++) {
                if (i === 0) {
                    // Add listener to first item in list only.
                    categoryItems[0].addEventListener('keydown', function (e) {
                        if (e.shiftKey === true && e.keyCode === Keyboard.TAB) {
                            // Look for shift + tab key
                            // Time out needed to prevent collision with OneTrust listener on tab key
                            setTimeout(function () {
                                acceptCookiesButton.focus();
                            }, 100);
                        }
                        if (e.shiftKey === false && e.keyCode === Keyboard.TAB) {
                            // Look for tab key
                            // Time out needed to prevent collision with OneTrust listener on tab key
                            setTimeout(function () {
                                generalContentArea.focus();
                            }, 100);
                        }
                    });
                } else {
                    // Captures focus to only OneTrust tool. Prevents shift tab from going into page level elements
                    categoryItems[i].addEventListener('keydown', function (e) {
                        if (e.shiftKey === true && e.keyCode === Keyboard.TAB) {
                            // Look for shift + tab key
                            // Time out needed to prevent collision with OneTrust listener on tab key
                            setTimeout(function () {
                                acceptCookiesButton.focus();
                            }, 100);
                        }
                    });
                }
            }
        }

        // OneTrust activates menu items with left and right arrow keys.
        // We just need to look for the active item and pass it into toggleButtons()
        function toggleArrowKeyDirection() {
            // Check for active menu then pass it into toggle button function
            for (let i = 0; i < categoryItems.length; i++) {
                if (categoryItems[i].classList.contains('ot-active-menu')) {
                    toggleButtons(categoryItems[i]);
                }
            }
        }
    }

    function waitForOneTrustContainer() {
        // Container may not be on the page at the time of page load, wait for it
        var oneTrustStatusInterval = setInterval(function () {
            // Try to set one trust container
            oneTrustContainer = document.querySelector('#onetrust-pc-sdk');
            // Check that we have a container
            if (oneTrustContainer !== undefined && oneTrustContainer !== null && oneTrustContainer) {
                // If we have a container, proceed with change button wireup. Then clear interval.
                changeButtons();
                clearInterval(oneTrustStatusInterval);
            }

            if (count++ > 10) {
                // timeout if this takes more than 5 sec
                clearInterval(oneTrustStatusInterval);
            }
        }, 500);
    }

    function init() {
        waitForOneTrustContainer();
    }

    return {
        init: init,
        oneTrustComponent: oneTrustComponent,
    };
})();

function runOneTrustComponent() {
    oneTrustComponent.init();
}

// In case the document is already rendered
if (document.readyState != 'loading') runOneTrustComponent();
// Modern browsers
else if (document.addEventListener) document.addEventListener('DOMContentLoaded', runOneTrustComponent);
// IE <= 8
else
    document.attachEvent('onreadystatechange', function () {
        if (document.readyState == 'complete') runOneTrustComponent();
    });
