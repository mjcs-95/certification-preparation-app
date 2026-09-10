/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create(types) {
        function isAnswered(question, response) {
            return Boolean(question && types[question.type]?.isAnswered(question, response));
        }
        function evaluateQuestion(question, response) {
            return isAnswered(question, response) && Boolean(types[question.type].evaluate(question, response));
        }
        return { isAnswered, evaluateQuestion };
    }
    window.CertPrep.evaluation = { create };
})();
