/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({ getState, isAnswered }) {
        function currentQuiz() {
            const state = getState();
            return state.quizIds.map((id) => state.bank.find((question) => question.id === id)).filter(Boolean);
        }
        function currentQuestion() {
            const state = getState();
            return currentQuiz()[state.currentIndex];
        }
        function answeredCount(quiz = currentQuiz()) {
            const state = getState();
            return quiz.filter((question) => isAnswered(question, state.responses[question.id])).length;
        }
        function progress(quiz = currentQuiz()) {
            const state = getState();
            const total = quiz.length;
            const position = total ? state.currentIndex + 1 : 0;
            return {
                current: position,
                total,
                answered: answeredCount(quiz),
                percentage: total ? (position / total) * 100 : 0,
            };
        }
        return { currentQuiz, currentQuestion, answeredCount, progress };
    }
    namespace.quizProgress = { create };
})();
