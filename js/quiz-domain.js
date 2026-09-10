/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ selection, createMatchingOrders, evaluate, isAnswered, resetAnswers, replaceBank }) {
        const quiz = state => state.quizIds.map(id => state.bank.find(q => q.id === id)).filter(Boolean);
        const fail = (code, variables) => ({ ok: false, value: null, error: { code, variables }, effects: {} });
        function execute(snapshot, command, payload) {
            const state = { ...snapshot, config: { ...snapshot.config },
                responses: { ...snapshot.responses }, evaluations: { ...snapshot.evaluations } };
            const questions = quiz(state);
            const question = questions[state.currentIndex];
            const effects = { render: "quiz", persist: true };
            switch (command) {
                case "start": {
                    const available = selection.availableQuestions(state.bank, payload.category);
                    if (!Number.isInteger(payload.count) || payload.count < 1) return fail("validation.countPositive");
                    if (payload.count > available.length) return fail("validation.countAvailable", { count: available.length });
                    state.config = { ...payload };
                    const selected = selection.select(state.bank, state.config);
                    state.quizIds = selected.quizIds;
                    state.matchingOrders = createMatchingOrders(selected.questions, state.matchingOrders);
                    resetAnswers(state);
                    state.view = "quiz";
                    effects.view = "quiz";
                    effects.resetMatch = true;
                    break;
                }
                case "navigate":
                    if (!Number.isInteger(payload) || payload < 0 || payload >= state.quizIds.length) return fail("noop");
                    state.currentIndex = payload;
                    effects.resetMatch = true;
                    effects.scroll = true;
                    break;
                case "answer":
                    if (!question || question.id !== payload.id || state.evaluations[payload.id]) return fail("locked");
                    state.responses[payload.id] = payload.response;
                    delete state.evaluations[payload.id];
                    effects.render = payload.render || "progress";
                    break;
                case "check":
                    if (!question || !isAnswered(question, state.responses[question.id])) return fail("noop");
                    state.evaluations[question.id] = { correct: evaluate(question, state.responses[question.id]) };
                    break;
                case "finish":
                    if (!questions.length) return fail("noop");
                    questions.forEach(q => { state.evaluations[q.id] = { correct: evaluate(q, state.responses[q.id]) }; });
                    state.completed = true;
                    state.view = "results";
                    effects.view = "results";
                    break;
                case "reset":
                    resetAnswers(state);
                    effects.resetMatch = true;
                    effects.toast = "quiz.answersReset";
                    break;
                case "retry": {
                    const wrong = questions.filter(q => !state.evaluations[q.id]?.correct);
                    if (!wrong.length) return fail("noop");
                    state.quizIds = wrong.map(q => q.id);
                    state.matchingOrders = createMatchingOrders(wrong, state.matchingOrders);
                    state.config = { ...state.config, count: wrong.length, mode: "practice" };
                    resetAnswers(state);
                    state.view = "quiz";
                    effects.view = "quiz";
                    effects.resetMatch = true;
                    break;
                }
                case "bank":
                    replaceBank(state, payload.questions, payload.title);
                    effects.view = "setup";
                    effects.resetMatch = true;
                    effects.toast = "toast.questionsLoaded";
                    effects.variables = { count: payload.questions.length };
                    break;
                case "view":
                    state.view = payload === "quiz" && !question ? "setup" : payload;
                    effects.view = state.view;
                    break;
                case "theme":
                    state.theme = state.theme === "dark" ? "light" : "dark";
                    effects.render = "theme";
                    break;
                default: return fail("unknown-command");
            }
            return { ok: true, value: state, error: null, effects };
        }
        return { execute, quiz };
    }
    window.CertPrep.quizDomain = { create };
})();
