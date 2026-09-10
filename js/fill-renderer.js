/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ elements, getState, translate: t, createElement: create, createText, answer }) {
        function renderFillQuestion(question, evaluation) {
            const state = getState();
            const container = create("div", "fill-text");
            const response = state.responses[question.id] || {};
            const regex = /{{\s*([\w-]+)\s*}}/g;
            let cursor = 0;
            let match;
            elements.questionContent.append(create("p", "blank-instruction", t("quiz.blankInstruction")));
            while ((match = regex.exec(question.question)) !== null) {
                container.append(createText(question.question.slice(cursor, match.index)));
                const blankId = match[1];
                const blank = question.blanks.find((item) => item.id === blankId);
                if (!blank) {
                    container.append(createText(match[0]));
                    cursor = regex.lastIndex;
                    continue;
                }
                const select = create("select");
                select.className = "blank-select";
                select.setAttribute("aria-label", t("quiz.blankAnswer", { id: blankId }));
                select.add(new Option(t("quiz.select"), ""));
                blank.options.forEach((option) => select.add(new Option(option, option)));
                select.value = response[blankId] || "";
                select.disabled = Boolean(evaluation);
                if (evaluation)
                    select.classList.add(
                        response[blankId] === blank.correctAnswer ? "blank-correct" : "blank-incorrect",
                    );
                select.addEventListener("change", () => {
                    answer({ id: question.id,
                        response: { ...(getState().responses[question.id] || {}), [blankId]: select.value } });
                });
                container.append(select);
                cursor = regex.lastIndex;
            }
            container.append(createText(question.question.slice(cursor)));
            elements.questionContent.append(container);
        }
        return { render: renderFillQuestion };
    }
    window.CertPrep.fillRenderer = { create };
})();
