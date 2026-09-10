/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ elements, getState, createElement: create, answer }) {
        function renderOptionQuestion(question, evaluation) {
            const state = getState();
            const multiple = question.type === "multiple-response";
            const isTrueFalse = question.type === "true-false";
            const wrapper = create("div", `answer-options${isTrueFalse ? " true-false-options" : ""}`);
            const response = state.responses[question.id];
            question.options.forEach((option, index) => {
                const label = create("label", "answer-option");
                const input = create("input");
                input.type = multiple ? "checkbox" : "radio";
                input.name = `answer-${question.id}`;
                input.value = option.id;
                input.checked = multiple
                    ? Array.isArray(response) && response.includes(option.id)
                    : response === option.id;
                input.disabled = Boolean(evaluation);
                if (evaluation) {
                    label.classList.add("is-locked");
                    const correct = question.correctAnswers.includes(option.id);
                    if (correct) label.classList.add("correct-answer");
                    if (input.checked && !correct) label.classList.add("incorrect-answer");
                }
                input.addEventListener("change", () => {
                    answer({ id: question.id, response: multiple
                        ? [...wrapper.querySelectorAll("input:checked")].map(control => control.value)
                        : option.id });
                });
                label.append(
                    ...(isTrueFalse
                        ? [input, create("span", "option-copy", option.text)]
                        : [
                              input,
                              create("span", "option-key", String.fromCharCode(65 + index)),
                              create("span", "option-copy", option.text),
                          ]),
                );
                wrapper.append(label);
            });
            elements.questionContent.append(wrapper);
        }
        return { render: renderOptionQuestion };
    }
    window.CertPrep.optionRenderer = { create };
})();
