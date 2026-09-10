/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ getState, elements, translate: t, progress, questionMap, questionRenderer, getExpanded }) {
        function renderProgress() {
            const state = getState();
            const quiz = progress.currentQuiz();
            const data = progress.progress(quiz);
            elements.quizModeLabel.textContent = t(state.config.mode === "exam" ? "quiz.examMode" : "quiz.practiceMode");
            elements.progressText.textContent = t("quiz.progress", { current: data.current, total: data.total });
            elements.answeredText.textContent = t("quiz.answered", { count: data.answered });
            elements.progressFill.style.width = `${data.percentage}%`;
            elements.progressTrack.setAttribute("aria-valuenow", String(Math.round(data.percentage)));
            questionMap.render(quiz, getExpanded());
        }
        function render() {
            const question = progress.currentQuestion();
            if (!question) return;
            renderProgress();
            questionRenderer.render(question, getState().currentIndex + 1);
            questionRenderer.renderControls(getState().quizIds.length);
        }
        return { render, renderProgress };
    }
    window.CertPrep.quizView = { create };
})();
