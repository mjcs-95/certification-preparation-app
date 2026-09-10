/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});
    function create({ elements, actions, getState, isFormControl, getQuestionMapExpanded, eventTarget, keyboardTarget, getActiveElement }) {
        elements.languageSelect.addEventListener("change", () => actions.setLocale(elements.languageSelect.value));
        elements.questionMapToggle.addEventListener("click", () =>
            actions.setQuestionMapExpanded(!getQuestionMapExpanded()),
        );
        elements.themeToggle.addEventListener("click", actions.toggleTheme);
        elements.clearSession.addEventListener("click", actions.clearSession);
        elements.brandLink.addEventListener("click", actions.goHome);
        elements.loadDemo.addEventListener("click", actions.loadDemo);
        elements.validateLoad.addEventListener("click", actions.validateLoad);
        elements.fileInput.addEventListener("change", () => actions.readQuestionFile(elements.fileInput.files[0]));
        ["dragenter", "dragover"].forEach((name) => elements.fileDrop.addEventListener(name, actions.dragOver));
        ["dragleave", "drop"].forEach((name) => elements.fileDrop.addEventListener(name, actions.dragLeave));
        elements.fileDrop.addEventListener("drop", (event) => actions.readQuestionFile(event.dataTransfer.files[0]));
        elements.changeSource.addEventListener("click", actions.changeSource);
        elements.configForm.addEventListener("submit", actions.startQuiz);
        elements.categoryFilter.addEventListener("change", actions.categoryChange);
        elements.previous.addEventListener("click", actions.previous);
        elements.next.addEventListener("click", actions.next);
        elements.checkQuestion.addEventListener("click", actions.checkQuestion);
        elements.finish.addEventListener("click", actions.finish);
        elements.resetAnswers.addEventListener("click", actions.resetAnswers);
        elements.exitQuiz.addEventListener("click", actions.exitQuiz);
        elements.retryWrong.addEventListener("click", actions.retryWrong);
        elements.newSession.addEventListener("click", actions.newSession);
        eventTarget.addEventListener("resize", actions.resize);
        keyboardTarget.addEventListener("keydown", (event) => {
            if (getState().view !== "quiz" || isFormControl(getActiveElement())) return;
            if (event.key === "ArrowLeft") actions.previous();
            if (event.key === "ArrowRight") actions.next();
        });
    }
    namespace.eventBindings = { create };
})();
