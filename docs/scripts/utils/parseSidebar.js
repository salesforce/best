/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

module.exports = function parseSidebar(activePageDoc, allPageDocs, { levels = 2 } = {}) {
    return allPageDocs.map((pageDoc) => {
        const isSelected = activePageDoc.docName === pageDoc.docName;
        return {
            id: pageDoc.docName,
            title: pageDoc.metadata.title,
            children: isSelected ? pageDoc.headers.filter((h) => h.level <= levels) : null,
            isSelected,
        };
    });
};
