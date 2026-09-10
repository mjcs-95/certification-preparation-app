/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.state = {
    resetAnswers(state) {
        state.responses = {};
        state.evaluations = {};
        state.currentIndex = 0;
        state.completed = false;
    },

    replace(state, next) {
        Object.keys(state).forEach((key) => delete state[key]);
        Object.assign(state, next);
    },

    replaceBank(state, bank, title) {
        this.resetAnswers(state);
        state.bank = bank;
        state.bankTitle = title;
        state.quizIds = [];
        state.matchingOrders = {};
        state.config.count = Math.min(Math.max(1, state.config.count || 10), bank.length);
        state.view = "setup";
    },

    createDefaultState({ prefersDark = false } = {}) {
        return {
            bank: [],
            bankTitle: "",
            config: {
                count: 10,
                category: "all",
                selection: "ordered",
                mode: "practice",
                immediateExplanation: true,
            },
            quizIds: [],
            matchingOrders: {},
            responses: {},
            evaluations: {},
            currentIndex: 0,
            completed: false,
            view: "import",
            theme: prefersDark ? "dark" : "light",
        };
    },
};
