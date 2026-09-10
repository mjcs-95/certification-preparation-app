/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ getState, answer, render, notify, domain }) {
        let active = null;
        function select(questionId, leftId) {
            active = { questionId, leftId };
            render();
        }
        function connect(question, rightId) {
            if (!active || active.questionId !== question.id) {
                notify("quiz.selectLeftFirst");
                return { ok: false, value: null, error: { code: "missing-left" } };
            }
            const response = domain.connect(getState().responses[question.id], active.leftId, rightId);
            const previous = active;
            active = null;
            const result = answer({ id: question.id, response, render: "quiz" });
            if (!result.ok) active = previous;
            return result;
        }
        function remove(question, leftId) {
            const response = domain.remove(getState().responses[question.id], leftId);
            return answer({ id: question.id, response, render: "quiz" });
        }
        return { select, connect, remove, getActive: () => active, reset: () => { active = null; } };
    }
    window.CertPrep.matchingController = { create };
})();
