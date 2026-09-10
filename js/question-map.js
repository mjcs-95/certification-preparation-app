/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.questionMap = {
    create({ getState, elements, translate, createElement, isAnswered, goToQuestion }) {
        function setExpanded(expanded) {
            elements.questionMapContent.hidden = !expanded;
            elements.questionMapToggle.setAttribute("aria-expanded", String(expanded));
            elements.questionMapToggle.textContent = expanded ? translate("quiz.hideMap") : translate("quiz.showMap");
        }

        function render(quiz, expanded) {
            const state = getState();
            setExpanded(expanded);
            elements.questionNav.replaceChildren();
            quiz.forEach((question, index) => {
                const button = createElement("button", "nav-question", String(index + 1));
                button.type = "button";
                button.setAttribute("aria-label", translate("quiz.goTo", { number: index + 1 }));
                if (index === state.currentIndex) {
                    button.classList.add("current");
                    button.setAttribute("aria-current", "step");
                }
                if (isAnswered(question, state.responses[question.id])) button.classList.add("answered");
                if (state.evaluations[question.id])
                    button.classList.add(state.evaluations[question.id].correct ? "correct" : "incorrect");
                button.addEventListener("click", () => goToQuestion(index));
                elements.questionNav.append(button);
            });
        }

        return { render, setExpanded };
    },
};
