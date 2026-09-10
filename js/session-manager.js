/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ key, initialState, defaultState, storage }) {
        const clone = value => JSON.parse(JSON.stringify(value));
        function freeze(value) {
            if (value && typeof value === "object" && !Object.isFrozen(value)) {
                Object.values(value).forEach(freeze);
                Object.freeze(value);
            }
            return value;
        }
        let snapshot = freeze(clone(initialState));
        const read = () => snapshot;
        function replace(next) {
            snapshot = freeze(next);
            return { ok: true, value: snapshot, error: null };
        }
        function load() {
            try {
                const saved = JSON.parse(storage.read(key));
                if (!saved || !Array.isArray(saved.bank)) return { ok: false, value: null, error: { code: "empty" } };
                const restored = { ...defaultState(), ...saved };
                restored.config = { ...defaultState().config, ...(saved.config || {}) };
                for (const field of ["responses", "evaluations", "matchingOrders"])
                    restored[field] = saved[field] && typeof saved[field] === "object" ? saved[field] : {};
                restored.quizIds = Array.isArray(saved.quizIds)
                    ? saved.quizIds.filter(id => restored.bank.some(q => q.id === id)) : [];
                if (!restored.bank.length) restored.view = "import";
                if (!restored.quizIds.length && ["quiz", "results"].includes(restored.view)) restored.view = "setup";
                restored.currentIndex = Math.min(Math.max(Math.trunc(Number(restored.currentIndex)) || 0, 0),
                    Math.max(restored.quizIds.length - 1, 0));
                return replace(restored);
            } catch (error) { return { ok: false, value: null, error: { code: "restore", cause: error } }; }
        }
        function save() {
            try {
                const ok = storage.write(key, JSON.stringify(snapshot));
                return { ok: Boolean(ok), value: null, error: ok ? null : { code: "storage" } };
            } catch (error) { return { ok: false, value: null, error: { code: "storage", cause: error } }; }
        }
        function clear() {
            storage.remove(key);
            return replace({ ...defaultState(), theme: snapshot.theme });
        }
        return { read, replace, load, save, clear };
    }
    window.CertPrep.sessionManager = { create };
})();
