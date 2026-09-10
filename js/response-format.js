/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({ translate, isAnswered }) {
        function resultMessage(percentage) {
            if (percentage === 100) return translate("results.message.full");
            if (percentage >= 80) return translate("results.message.great");
            if (percentage >= 60) return translate("results.message.track");
            return translate("results.message.focus");
        }

        function formatResponse(question, response) {
            if (!isAnswered(question, response)) return translate("format.unanswered");
            if (["multiple-choice", "true-false", "scenario"].includes(question.type))
                return question.options.find((option) => option.id === response)?.text || String(response);
            if (question.type === "multiple-response")
                return response.map((id) => question.options.find((option) => option.id === id)?.text || id).join("; ");
            if (question.type === "matching")
                return question.leftItems
                    .map((left) => {
                        const right = question.rightItems.find((item) => item.id === response[left.id]);
                        return `${left.text} → ${right?.text || translate("format.noMatch")}`;
                    })
                    .join("; ");
            if (question.type === "fill-blank")
                return question.blanks
                    .map((blank) => `${blank.id}: ${response[blank.id] || translate("format.unanswered")}`)
                    .join("; ");
            return translate("format.unanswered");
        }

        function formatCorrectAnswer(question) {
            if (["multiple-choice", "multiple-response", "true-false", "scenario"].includes(question.type))
                return question.correctAnswers
                    .map((id) => question.options.find((option) => option.id === id)?.text || id)
                    .join("; ");
            if (question.type === "matching")
                return question.leftItems
                    .map((left) => {
                        const right = question.rightItems.find((item) => item.id === question.correctMatches[left.id]);
                        return `${left.text} → ${right?.text || question.correctMatches[left.id]}`;
                    })
                    .join("; ");
            if (question.type === "fill-blank")
                return question.blanks.map((blank) => `${blank.id}: ${blank.correctAnswer}`).join("; ");
            return translate("format.noAnswer");
        }

        return { formatResponse, formatCorrectAnswer, resultMessage };
    }
    namespace.responseFormat = { create };
})();
