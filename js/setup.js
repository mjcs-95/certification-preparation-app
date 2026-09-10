/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.setup = {
    create({ getState, elements, translate, createElement, countBy, uniqueCategories, forms, clearMessage }) {
        function render() {
            const state = getState();
            clearMessage(elements.configMessage);
            const typeCounts = countBy(state.bank, (question) => question.type);
            const categories = uniqueCategories(state.bank);
            elements.totalQuestions.textContent = String(state.bank.length);
            elements.totalTypes.textContent = String(Object.keys(typeCounts).length);
            elements.totalCategories.textContent = String(categories.length);

            elements.typeSummary.replaceChildren();
            Object.entries(typeCounts).forEach(([type, count]) => {
                const row = createElement("div", "distribution-row");
                row.append(createElement("strong", "", translate(`type.${type}`)));
                const track = createElement("span", "distribution-track");
                const fill = createElement("span");
                fill.style.width = `${(count / state.bank.length) * 100}%`;
                track.append(fill);
                row.append(track, createElement("span", "", String(count)));
                elements.typeSummary.append(row);
            });

            elements.categorySummary.replaceChildren();
            categories.forEach((category) => elements.categorySummary.append(createElement("span", "tag", category)));
            elements.categoryFilter.replaceChildren(new Option(translate("setup.allCategories"), "all"));
            categories.forEach((category) => elements.categoryFilter.add(new Option(category, category)));
            elements.categoryFilter.value = categories.includes(state.config.category) ? state.config.category : "all";
            elements.questionCount.max = String(state.bank.length);
            elements.questionCount.value = String(
                Math.min(Math.max(1, Number(state.config.count) || 10), state.bank.length),
            );
            forms.writeConfig(state.config);
        }

        return { render };
    },
};
