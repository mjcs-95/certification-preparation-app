/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    // Domain protocol: isAnswered(question, response), evaluate(question, response).
    const single = {
        isAnswered: (_q, response) => response != null && String(response).trim() !== "",
        evaluate: (q, response) => response === q.correctAnswers?.[0],
    };
    const multiple = {
        isAnswered: (_q, response) => Array.isArray(response) && response.length > 0,
        evaluate(q, response) {
            const expected = new Set(q.correctAnswers || []);
            const actual = new Set(Array.isArray(response) ? response : []);
            return expected.size === actual.size && [...expected].every(id => actual.has(id));
        },
    };
    const matching = {
        isAnswered: (q, response) => q.leftItems.every(item => String(response?.[item.id] || "").trim() !== ""),
        evaluate(q, response) {
            const expected = q.correctMatches || {};
            const actual = response && typeof response === "object" ? response : {};
            const keys = Object.keys(expected);
            return keys.length === Object.keys(actual).length && keys.every(id => actual[id] === expected[id]);
        },
    };
    const fill = {
        isAnswered: (q, response) => q.blanks.every(blank => String(response?.[blank.id] || "").trim() !== ""),
        evaluate: (q, response) => (q.blanks || []).every(blank => response?.[blank.id] === blank.correctAnswer),
    };
    window.CertPrep.questionTypes = {
        "multiple-choice": single, scenario: single, "true-false": single,
        "multiple-response": multiple, matching, "fill-blank": fill,
    };
})();
