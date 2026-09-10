/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ session, quiz, importer, forms, elements, messages, effects, translate: t,
        demoBank, selection, locale, theme, matching, platform, map }) {
        function validateLoad() {
            messages.clearMessage(elements.importMessage);
            const result = importer.parseAndLoad(elements.jsonInput.value);
            if (!result.ok) messages.setMessage(elements.importMessage, "error", result.error.messages, result.error.footer);
            return result;
        }
        async function readQuestionFile(file) {
            messages.clearMessage(elements.importMessage);
            const result = await importer.readFile(file);
            if (result.ok) {
                elements.jsonInput.value = result.value;
                messages.setMessage(elements.importMessage, "success", [t("import.fileReady", { name: file.name })]);
            } else if (result.error.messages.length) {
                messages.setMessage(elements.importMessage, "error", result.error.messages);
            }
            return result;
        }
        function startQuiz(event) {
            event.preventDefault();
            messages.clearMessage(elements.configMessage);
            const result = quiz.startQuiz(forms.readConfig());
            if (!result.ok) messages.setMessage(elements.configMessage, "error", [t(result.error.code, result.error.variables)]);
            return result;
        }
        function clearSession() {
            if (!effects.confirm("confirm.clearSession")) return { ok: false, value: null, error: { code: "cancelled" } };
            const result = session.clear();
            forms.clearImport();
            theme.applyTheme();
            effects.apply({ view: "import", persist: true, resetMatch: true, toast: "toast.sessionCleared" });
            return result;
        }
        function drag(event, active) {
            event.preventDefault();
            elements.fileDrop.classList[active ? "add" : "remove"]("is-dragging");
        }
        return {
            setLocale: locale.setLocale, setQuestionMapExpanded: map.setExpanded,
            toggleTheme: quiz.run.bind(null, "theme"), clearSession,
            goHome(event) { event.preventDefault(); return quiz.run("view", session.read().bank.length ? "setup" : "import"); },
            loadDemo() {
                elements.jsonInput.value = JSON.stringify(demoBank, null, 2);
                messages.setMessage(elements.importMessage, "success", [t("toast.demoPrepared")]);
            },
            validateLoad, readQuestionFile, startQuiz,
            dragOver: event => drag(event, true), dragLeave: event => drag(event, false),
            changeSource: quiz.run.bind(null, "view", "import"),
            categoryChange() { forms.limitCount(selection.availableQuestions(session.read().bank, elements.categoryFilter.value).length); },
            previous: () => quiz.goToQuestion(session.read().currentIndex - 1),
            next: () => quiz.goToQuestion(session.read().currentIndex + 1),
            checkQuestion: quiz.checkCurrentQuestion, finish: quiz.finishQuiz,
            resetAnswers: quiz.resetQuizAnswers, retryWrong: quiz.retryWrongQuestions,
            exitQuiz: quiz.run.bind(null, "view", "setup"), newSession: quiz.run.bind(null, "view", "setup"),
            resize: () => platform.requestAnimationFrame(matching.drawLines),
        };
    }
    window.CertPrep.appActions = { create };
})();
