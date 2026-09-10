/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({
        elements,
        getState,
        translate: t,
        createElement,
        categoryOf,
        typeLabel,
        renderers,
    }) {
        function render(question, position) {
            const state = getState();
            const evaluation = state.evaluations[question.id];
            elements.questionNumber.textContent = t("quiz.question", { number: position });
            elements.questionCategory.textContent = categoryOf(question);
            elements.questionType.textContent = typeLabel(question.type);
            elements.questionContent.replaceChildren();
            elements.feedback.replaceChildren();
            if (question.scenario) {
                elements.scenario.hidden = false;
                elements.scenario.replaceChildren(
                    createElement("strong", "", t("quiz.scenario")),
                    createElement("p", "", question.scenario),
                );
            } else {
                elements.scenario.hidden = true;
                elements.scenario.replaceChildren();
            }
            elements.questionContent.append(
                createElement(
                    "h2",
                    "question-prompt",
                    question.type === "fill-blank" ? t("quiz.completeStatement") : question.question,
                ),
            );
            if (question.description)
                elements.questionContent.append(createElement("p", "question-description", question.description));
            const renderer = renderers[question.type];
            if (renderer) renderer.render(question, evaluation);
            if (evaluation) renderFeedback(question, evaluation);
        }
        function renderFeedback(question, evaluation) {
            const box = createElement("div", `feedback ${evaluation.correct ? "correct" : "incorrect"}`);
            box.append(createElement("strong", "", evaluation.correct ? t("quiz.correct") : t("quiz.incorrect")));
            box.append(createElement("p", "", evaluation.correct ? t("quiz.selectedExpected") : t("quiz.reviewSolution")));
            if (getState().config.immediateExplanation && question.explanation) {
                box.append(createElement("p", "explanation", question.explanation));
            }
            elements.feedback.append(box);
        }

        function renderQuestionControls(total) {
            const state = getState();
            elements.previous.disabled = state.currentIndex === 0;
            elements.next.hidden = state.currentIndex === total - 1;
            elements.checkQuestion.hidden = state.config.mode === "exam";
            elements.checkQuestion.disabled = Boolean(state.evaluations[state.quizIds[state.currentIndex]]);
            elements.finish.hidden = false;
            elements.finish.textContent = state.config.mode === "exam" ? t("quiz.finishExam") : t("quiz.checkAll");
        }

        return { render, renderControls: renderQuestionControls };
    }
    namespace.questionRenderer = { create };
})();
