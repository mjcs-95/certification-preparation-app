/* SPDX-License-Identifier: AGPL-3.0-only */
// Composition helper: every type implements render(question, evaluation).
(() => {
    "use strict";
    function create({ option, fill, matching }) {
        return {
            "multiple-choice": option, scenario: option, "multiple-response": option,
            "true-false": option, matching, "fill-blank": fill,
        };
    }
    window.CertPrep.questionTypeRenderers = { create };
})();
