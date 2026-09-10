/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function connect(current, leftId, rightId) {
        const response = { ...current };
        Object.keys(response).forEach(id => { if (response[id] === rightId) delete response[id]; });
        response[leftId] = rightId;
        return response;
    }
    function remove(current, leftId) {
        const response = { ...current };
        delete response[leftId];
        return response;
    }
    window.CertPrep.matchingDomain = { connect, remove };
})();
