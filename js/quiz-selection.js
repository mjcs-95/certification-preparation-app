/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({ shuffle, categoryOf }) {
        function availableQuestions(bank, category) {
            return bank.filter((question) => category === "all" || categoryOf(question) === category);
        }
        function select(bank, { category = "all", count, selection = "all" }) {
            const available = availableQuestions(bank, category);
            const pool = selection === "random" ? shuffle([...available]) : [...available];
            const questions = pool.slice(0, count);
            return { available, questions, quizIds: questions.map((question) => question.id) };
        }
        return { availableQuestions, select };
    }
    namespace.quizSelection = { create };
})();
