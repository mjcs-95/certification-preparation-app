/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ session, domain, effects, isAnswered }) {
        function run(command, payload) {
            const result = domain.execute(session.read(), command, payload);
            if (result.ok) {
                session.replace(result.value);
                effects.apply(result.effects);
            }
            return result;
        }
        function finishQuiz() {
            const state = session.read();
            const unanswered = domain.quiz(state).filter(q => !isAnswered(q, state.responses[q.id])).length;
            if (unanswered && !effects.confirm("quiz.finishUnanswered", { count: unanswered }))
                return { ok: false, value: null, error: { code: "cancelled" } };
            return run("finish");
        }
        function resetQuizAnswers() {
            if (!effects.confirm("quiz.resetConfirm"))
                return { ok: false, value: null, error: { code: "cancelled" } };
            return run("reset");
        }
        return {
            run, goToQuestion: run.bind(null, "navigate"), startQuiz: run.bind(null, "start"),
            checkCurrentQuestion: run.bind(null, "check"), finishQuiz, resetQuizAnswers,
            retryWrongQuestions: run.bind(null, "retry"), answer: run.bind(null, "answer"),
        };
    }
    window.CertPrep.quizController = { create };
})();
