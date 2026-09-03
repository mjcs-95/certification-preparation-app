/* 
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (c) 2026 mjcs-95 and contributors
*/
(() => {
    "use strict";

    const STORAGE_KEY = "certprep.quiz-session.v1";
    const LOCALE_STORAGE_KEY = "certprep.locale.v1";
    const SUPPORTED_LOCALES = ["en", "es", "fr"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    let currentLocale = detectInitialLocale();

    function normalizeLocale(value) {
        const language = String(value || "")
            .toLowerCase()
            .split(/[-_]/)[0];
        return SUPPORTED_LOCALES.includes(language) ? language : null;
    }

    function detectInitialLocale() {
        try {
            const saved = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
            if (saved) return saved;
        } catch (error) {
            // Some privacy modes disable localStorage; browser preferences still work.
        }
        const preferences =
            Array.isArray(navigator.languages) && navigator.languages.length
                ? navigator.languages
                : [navigator.language];
        return preferences.map(normalizeLocale).find(Boolean) || "en";
    }

    function t(key, variables = {}) {
        const locales = window.CERTPREP_LOCALES || {};
        const table = locales[currentLocale] || locales.en || {};
        const fallback = locales.en?.[key] ?? key;
        const value = table[key] ?? fallback;
        const text = typeof value === "function" ? value(variables) : value;
        return String(text).replace(/\{(\w+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : match,
        );
    }

    function typeLabel(type) {
        return t(`type.${type}`);
    }

    const DEMO_BANK = {
        version: "1.0",
        title: "Certification preparation demo",
        questions: [
            {
                id: "demo-mc-01",
                type: "multiple-choice",
                category: "Cloud fundamentals",
                question: "Which characteristic lets you increase or reduce resources as demand changes?",
                description: "Select one answer.",
                options: [
                    { id: "a", text: "Elasticity" },
                    { id: "b", text: "Latency" },
                    { id: "c", text: "Reserved capacity" },
                    { id: "d", text: "Encryption" },
                ],
                correctAnswers: ["a"],
                explanation: "Elasticity adapts available capacity to changes in demand.",
                source: "Demo bank",
            },
            {
                id: "demo-mr-01",
                type: "multiple-response",
                category: "Security",
                question: "Which two practices reduce the risk associated with credentials?",
                description: "Select exactly two answers.",
                options: [
                    { id: "a", text: "Apply least privilege" },
                    { id: "b", text: "Share an administrator account" },
                    { id: "c", text: "Enable multifactor authentication" },
                    { id: "d", text: "Store keys in source code" },
                ],
                correctAnswers: ["a", "c"],
                explanation: "Least privilege limits account impact, while MFA adds another verification factor.",
                source: "Demo bank",
            },
            {
                id: "demo-tf-01",
                type: "true-false",
                category: "Governance",
                question: "A preventive policy can block resources that violate a rule from being created.",
                options: [
                    { id: "true", text: "True" },
                    { id: "false", text: "False" },
                ],
                correctAnswers: ["true"],
                explanation: "Preventive policies block non-compliant actions before they are completed.",
                source: "Demo bank",
            },
            {
                id: "demo-scenario-01",
                type: "scenario",
                category: "Architecture",
                scenario:
                    "An online store receives unpredictable traffic spikes. Its web tier is stateless and demand can multiply within minutes.",
                question: "Which approach best responds to this pattern?",
                description: "Consider both availability and cost.",
                options: [
                    { id: "a", text: "One very large instance" },
                    { id: "b", text: "Horizontal autoscaling behind a load balancer" },
                    { id: "c", text: "Manually increase storage" },
                    { id: "d", text: "Disable monitoring" },
                ],
                correctAnswers: ["b"],
                explanation:
                    "Because there is no local state, multiple instances can scale horizontally behind a load balancer.",
                source: "Demo bank",
            },
            {
                id: "demo-match-01",
                type: "matching",
                category: "Services",
                question: "Match each need with the most appropriate service type.",
                description: "Select an item on the left, then select its match on the right.",
                leftItems: [
                    { id: "l1", text: "Run event-driven code" },
                    { id: "l2", text: "Store objects" },
                    { id: "l3", text: "Distribute traffic" },
                ],
                rightItems: [
                    { id: "r1", text: "Object storage" },
                    { id: "r2", text: "Serverless functions" },
                    { id: "r3", text: "Load balancer" },
                ],
                correctMatches: { l1: "r2", l2: "r1", l3: "r3" },
                explanation: "Each service addresses a specific architecture responsibility.",
                source: "Demo bank",
            },
            {
                id: "demo-fill-01",
                type: "fill-blank",
                category: "Continuity",
                question:
                    "The {{rto}} defines the maximum time to restore service, while the {{rpo}} defines acceptable data loss measured in time.",
                description: "Complete both concepts.",
                blanks: [
                    { id: "rto", options: ["RTO", "RPO", "SLA"], correctAnswer: "RTO" },
                    { id: "rpo", options: ["MTTR", "RPO", "TCO"], correctAnswer: "RPO" },
                ],
                explanation: "RTO focuses on recovery time; RPO focuses on the recovery point for data.",
                source: "Demo bank",
            },
        ],
    };

    const defaultState = () => ({
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
        theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    });

    let state = defaultState();
    let activeMatchLeft = null;
    let toastTimer = null;

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    const elements = {
        views: $$(".view"),
        brandLink: $("#brand-link"),
        languageSelect: $("#language-select"),
        themeToggle: $("#theme-toggle"),
        themeIcon: $("#theme-icon"),
        clearSession: $("#clear-session"),
        saveIndicator: $("#save-indicator"),
        saveLabel: $("#save-label"),
        fileInput: $("#question-file"),
        fileDrop: $("#file-drop"),
        jsonInput: $("#json-input"),
        loadDemo: $("#load-demo"),
        validateLoad: $("#validate-load"),
        importMessage: $("#import-message"),
        changeSource: $("#change-source"),
        totalQuestions: $("#total-questions"),
        totalTypes: $("#total-types"),
        totalCategories: $("#total-categories"),
        typeSummary: $("#type-summary"),
        categorySummary: $("#category-summary"),
        configForm: $("#quiz-config"),
        questionCount: $("#question-count"),
        categoryFilter: $("#category-filter"),
        immediateExplanation: $("#immediate-explanation"),
        configMessage: $("#config-message"),
        quizModeLabel: $("#quiz-mode-label"),
        resetAnswers: $("#reset-answers"),
        exitQuiz: $("#exit-quiz"),
        progressText: $("#progress-text"),
        answeredText: $("#answered-text"),
        progressTrack: $(".progress-track"),
        progressFill: $("#progress-fill"),
        questionNav: $("#question-nav"),
        questionNumber: $("#question-number"),
        questionCategory: $("#question-category"),
        questionType: $("#question-type"),
        scenario: $("#scenario-container"),
        questionContent: $("#question-content"),
        feedback: $("#feedback-container"),
        previous: $("#previous-question"),
        checkQuestion: $("#check-question"),
        next: $("#next-question"),
        finish: $("#finish-quiz"),
        scoreRing: $("#score-ring"),
        scoreValue: $("#score-value"),
        resultsMessage: $("#results-message"),
        correctCount: $("#correct-count"),
        incorrectCount: $("#incorrect-count"),
        answeredCount: $("#answered-count"),
        retryWrong: $("#retry-wrong"),
        newSession: $("#new-session"),
        wrongBadge: $("#wrong-badge"),
        wrongQuestions: $("#wrong-questions"),
        toast: $("#toast"),
    };

    function applyStaticTranslations() {
        $$("[data-i18n]").forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });
        $$("[data-i18n-aria-label]").forEach((element) => {
            element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
        });
        $$("[data-i18n-title]").forEach((element) => {
            element.setAttribute("title", t(element.dataset.i18nTitle));
        });
        $$("[data-i18n-placeholder]").forEach((element) => {
            element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
        });
        document.documentElement.lang = currentLocale;
        document.title = t("meta.title");
        const description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute("content", t("meta.description"));
        if (elements.languageSelect) elements.languageSelect.value = currentLocale;
    }

    function applyLocale({ rerender = true } = {}) {
        applyStaticTranslations();
        if (!rerender) return;
        if (state.view === "setup" && state.bank.length) renderSetup();
        if (state.view === "quiz" && state.quizIds.length) renderQuiz();
        if (state.view === "results" && state.quizIds.length) renderResults();
    }

    function setLocale(value) {
        const locale = normalizeLocale(value) || "en";
        currentLocale = locale;
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        } catch (error) {
            // The app remains usable when storage is unavailable.
        }
        applyLocale();
    }

    // ---------- Persistence and state ----------

    function loadSavedState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!saved || !Array.isArray(saved.bank)) return false;
            const restored = { ...defaultState(), ...saved };
            restored.config = { ...defaultState().config, ...(saved.config || {}) };
            restored.responses = saved.responses && typeof saved.responses === "object" ? saved.responses : {};
            restored.evaluations = saved.evaluations && typeof saved.evaluations === "object" ? saved.evaluations : {};
            restored.matchingOrders = saved.matchingOrders && typeof saved.matchingOrders === "object" ? saved.matchingOrders : {};
            restored.quizIds = Array.isArray(saved.quizIds)
                ? saved.quizIds.filter((id) => restored.bank.some((q) => q.id === id))
                : [];
            if (!restored.bank.length) restored.view = "import";
            if (!restored.quizIds.length && ["quiz", "results"].includes(restored.view)) restored.view = "setup";
            restored.currentIndex = Math.min(
                Math.max(Number(restored.currentIndex) || 0, 0),
                Math.max(restored.quizIds.length - 1, 0),
            );
            state = restored;
            return true;
        } catch (error) {
            console.warn("The saved session could not be restored.", error);
            return false;
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            elements.saveLabel.textContent = t("header.saved");
            window.clearTimeout(saveState.indicatorTimer);
            saveState.indicatorTimer = window.setTimeout(() => {
                elements.saveLabel.textContent = t("header.savedLocally");
            }, 1200);
        } catch (error) {
            showToast(t("toast.sessionSaved"));
            console.warn("Error de persistencia", error);
        }
    }

    function clearSavedSession() {
        if (!window.confirm(t("confirm.clearSession"))) return;
        const currentTheme = state.theme;
        localStorage.removeItem(STORAGE_KEY);
        state = defaultState();
        state.theme = currentTheme;
        elements.jsonInput.value = "";
        elements.fileInput.value = "";
        applyTheme();
        showView("import");
        showToast(t("toast.sessionCleared"));
    }

    function currentQuiz() {
        return state.quizIds.map((id) => state.bank.find((question) => question.id === id)).filter(Boolean);
    }

    function currentQuestion() {
        return currentQuiz()[state.currentIndex];
    }

    // ---------- Import and validation ----------

    function parseAndLoadInput() {
        clearMessage(elements.importMessage);
        const raw = elements.jsonInput.value.trim();
        if (!raw) {
            setMessage(elements.importMessage, "error", [t("import.error.empty")]);
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (error) {
            setMessage(elements.importMessage, "error", [
                t("import.error.invalidJson", { error: error.message }),
            ]);
            return;
        }

        const result = validateQuestionBank(parsed);
        if (!result.valid) {
            setMessage(
                elements.importMessage,
                "error",
                result.errors.slice(0, 10),
                result.errors.length > 10 ? t("import.error.additional", { count: result.errors.length - 10 }) : "",
            );
            return;
        }

        state.bank = parsed.questions;
        state.bankTitle = typeof parsed.title === "string" ? parsed.title : t("import.importedBank");
        state.quizIds = [];
        state.matchingOrders = {};
        state.responses = {};
        state.evaluations = {};
        state.currentIndex = 0;
        state.completed = false;
        state.view = "setup";
        state.config.count = Math.min(Math.max(1, state.config.count || 10), state.bank.length);
        saveState();
        renderSetup();
        showView("setup");
        showToast(t("toast.questionsLoaded", { count: state.bank.length }));
    }

    function validateQuestionBank(data) {
        const errors = [];
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return { valid: false, errors: [t("validation.root")] };
        }
        if (!Array.isArray(data.questions)) {
            return { valid: false, errors: [t("validation.missingQuestions")] };
        }
        if (data.questions.length === 0) {
            return { valid: false, errors: [t("validation.emptyQuestions")] };
        }

        const knownTypes = new Set([
            "multiple-choice",
            "multiple-response",
            "true-false",
            "scenario",
            "matching",
            "fill-blank",
        ]);
        const seenIds = new Set();

        data.questions.forEach((question, index) => {
            const path = t("validation.question", { number: index + 1 });
            if (!question || typeof question !== "object" || Array.isArray(question)) {
                errors.push(t("validation.object", { path }));
                return;
            }
            if (!isNonEmptyString(question.id)) errors.push(t("validation.idRequired", { path }));
            else if (seenIds.has(question.id)) errors.push(t("validation.idDuplicate", { path, id: question.id }));
            else seenIds.add(question.id);

            if (!knownTypes.has(question.type)) {
                errors.push(t("validation.unknownType", { path, type: String(question.type || "no type") }));
                return;
            }
            if (!isNonEmptyString(question.question)) errors.push(t("validation.questionRequired", { path }));
            if (question.category !== undefined && !isNonEmptyString(question.category))
                errors.push(t("validation.categoryText", { path }));
            if (question.explanation !== undefined && typeof question.explanation !== "string")
                errors.push(t("validation.explanationText", { path }));

            if (["multiple-choice", "multiple-response", "true-false", "scenario"].includes(question.type)) {
                validateOptionQuestion(question, path, errors);
            }
            if (question.type === "multiple-choice" || question.type === "true-false" || question.type === "scenario") {
                if (Array.isArray(question.correctAnswers) && question.correctAnswers.length !== 1) {
                    errors.push(t("validation.singleCorrect", { path }));
                }
            }
            if (
                question.type === "multiple-response" &&
                Array.isArray(question.correctAnswers) &&
                question.correctAnswers.length < 1
            ) {
                errors.push(t("validation.correctAnswers", { path }));
            }
            if (question.type === "true-false" && Array.isArray(question.options)) {
                const ids = new Set(question.options.map((option) => option && option.id));
                if (!ids.has("true") || !ids.has("false") || ids.size !== 2)
                    errors.push(t("validation.trueFalseIds", { path }));
            }
            if (question.type === "scenario" && !isNonEmptyString(question.scenario)) {
                errors.push(t("validation.scenarioRequired", { path }));
            }
            if (question.type === "matching") validateMatchingQuestion(question, path, errors);
            if (question.type === "fill-blank") validateFillQuestion(question, path, errors);
        });

        return { valid: errors.length === 0, errors };
    }

    function validateOptionQuestion(question, path, errors) {
        if (!Array.isArray(question.options) || question.options.length < 2) {
            errors.push(t("validation.optionsCount", { path }));
            return;
        }
        const optionIds = new Set();
        question.options.forEach((option, optionIndex) => {
            if (!option || !isNonEmptyString(option.id) || !isNonEmptyString(option.text)) {
                errors.push(t("validation.optionFields", { path, number: optionIndex + 1 }));
            } else if (optionIds.has(option.id)) {
                errors.push(t("validation.optionDuplicate", { path, id: option.id }));
            } else optionIds.add(option.id);
        });
        if (!Array.isArray(question.correctAnswers) || !question.correctAnswers.length) {
            errors.push(t("validation.answerMissing", { path }));
            return;
        }
        question.correctAnswers.forEach((answer) => {
            if (!optionIds.has(answer)) errors.push(t("validation.answerUnknown", { path, id: answer }));
        });
        if (new Set(question.correctAnswers).size !== question.correctAnswers.length)
            errors.push(t("validation.answerDuplicate", { path }));
    }

    function validateMatchingQuestion(question, path, errors) {
        const leftIds = validateItems(question.leftItems, "leftItems", path, errors);
        const rightIds = validateItems(question.rightItems, "rightItems", path, errors);
        if (
            !question.correctMatches ||
            typeof question.correctMatches !== "object" ||
            Array.isArray(question.correctMatches)
        ) {
            errors.push(t("validation.matchObject", { path }));
            return;
        }
        leftIds.forEach((leftId) => {
            if (!Object.prototype.hasOwnProperty.call(question.correctMatches, leftId))
                errors.push(t("validation.matchMissing", { path, id: leftId }));
            else if (!rightIds.has(question.correctMatches[leftId]))
                errors.push(t("validation.matchUnknown", { path, id: leftId }));
        });
        Object.keys(question.correctMatches).forEach((leftId) => {
            if (!leftIds.has(leftId)) errors.push(t("validation.matchLeftUnknown", { path, id: leftId }));
        });
    }

    function validateItems(items, field, path, errors) {
        const ids = new Set();
        if (!Array.isArray(items) || items.length < 2) {
            errors.push(t("validation.itemsCount", { path, field }));
            return ids;
        }
        items.forEach((item, index) => {
            if (!item || !isNonEmptyString(item.id) || !isNonEmptyString(item.text))
                errors.push(t("validation.itemFields", { path, field, number: index }));
            else if (ids.has(item.id)) errors.push(t("validation.itemDuplicate", { path, id: item.id, field }));
            else ids.add(item.id);
        });
        return ids;
    }

    function validateFillQuestion(question, path, errors) {
        if (!Array.isArray(question.blanks) || !question.blanks.length) {
            errors.push(t("validation.blanksMissing", { path }));
            return;
        }
        const blankIds = new Set();
        question.blanks.forEach((blank, index) => {
            if (!blank || !isNonEmptyString(blank.id)) {
                errors.push(t("validation.blankId", { path, number: index }));
                return;
            }
            if (blankIds.has(blank.id)) errors.push(t("validation.blankDuplicate", { path, id: blank.id }));
            blankIds.add(blank.id);
            if (!Array.isArray(blank.options) || blank.options.length < 2 || !blank.options.every(isNonEmptyString))
                errors.push(t("validation.blankOptions", { path, id: blank.id }));
            if (!isNonEmptyString(blank.correctAnswer) || !blank.options?.includes(blank.correctAnswer))
                errors.push(t("validation.blankAnswer", { path, id: blank.id }));
            if (!question.question.includes(`{{${blank.id}}}`))
                errors.push(t("validation.blankMarkerMissing", { path, id: blank.id }));
        });
        const markers = Array.from(question.question.matchAll(/{{\s*([\w-]+)\s*}}/g), (match) => match[1]);
        markers.forEach((marker) => {
            if (!blankIds.has(marker)) errors.push(t("validation.blankMarkerUnknown", { path, id: marker }));
        });
    }

    function isNonEmptyString(value) {
        return typeof value === "string" && value.trim().length > 0;
    }

    async function readQuestionFile(file) {
        clearMessage(elements.importMessage);
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
            setMessage(elements.importMessage, "error", [t("import.error.extension")]);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setMessage(elements.importMessage, "error", [t("import.error.size")]);
            return;
        }
        try {
            elements.jsonInput.value = await file.text();
            setMessage(elements.importMessage, "success", [t("import.fileReady", { name: file.name })]);
        } catch (error) {
            setMessage(elements.importMessage, "error", [t("import.error.read")]);
        }
    }

    // ---------- Configuration ----------

    function renderSetup() {
        const typeCounts = countBy(state.bank, (question) => question.type);
        const categories = uniqueCategories(state.bank);
        elements.totalQuestions.textContent = String(state.bank.length);
        elements.totalTypes.textContent = String(Object.keys(typeCounts).length);
        elements.totalCategories.textContent = String(categories.length);

        elements.typeSummary.replaceChildren();
        Object.entries(typeCounts).forEach(([type, count]) => {
            const row = create("div", "distribution-row");
            row.append(create("strong", "", typeLabel(type)));
            const track = create("span", "distribution-track");
            const fill = create("span");
            fill.style.width = `${(count / state.bank.length) * 100}%`;
            track.append(fill);
            row.append(track, create("span", "", String(count)));
            elements.typeSummary.append(row);
        });

        elements.categorySummary.replaceChildren();
        categories.forEach((category) => elements.categorySummary.append(create("span", "tag", category)));

        elements.categoryFilter.replaceChildren(new Option(t("setup.allCategories"), "all"));
        categories.forEach((category) => elements.categoryFilter.add(new Option(category, category)));
        elements.categoryFilter.value = categories.includes(state.config.category) ? state.config.category : "all";
        state.config.category = elements.categoryFilter.value;

        elements.questionCount.max = String(state.bank.length);
        elements.questionCount.value = String(
            Math.min(Math.max(1, Number(state.config.count) || 10), state.bank.length),
        );
        const modeControl = $(`input[name="mode"][value="${state.config.mode}"]`);
        if (modeControl) modeControl.checked = true;
        const selectionControl = $(`input[name="selection"][value="${state.config.selection}"]`);
        if (selectionControl) selectionControl.checked = true;
        elements.immediateExplanation.checked = state.config.immediateExplanation;
        clearMessage(elements.configMessage);
    }

    function startQuiz(event) {
        event.preventDefault();
        clearMessage(elements.configMessage);
        const category = elements.categoryFilter.value;
        const available = state.bank.filter((question) => category === "all" || categoryOf(question) === category);
        const count = Number.parseInt(elements.questionCount.value, 10);
        if (!Number.isInteger(count) || count < 1) {
            setMessage(elements.configMessage, "error", [t("validation.countPositive")]);
            return;
        }
        if (count > available.length) {
            setMessage(elements.configMessage, "error", [t("validation.countAvailable", { count: available.length })]);
            return;
        }

        state.config = {
            count,
            category,
            selection: $("input[name='selection']:checked").value,
            mode: $("input[name='mode']:checked").value,
            immediateExplanation: elements.immediateExplanation.checked,
        };
        const selected = state.config.selection === "random" ? shuffle([...available]) : [...available];
        state.quizIds = selected.slice(0, count).map((question) => question.id);
        state.matchingOrders = createMatchingOrders(selected.slice(0, count), state.matchingOrders);
        state.responses = {};
        state.evaluations = {};
        state.currentIndex = 0;
        state.completed = false;
        state.view = "quiz";
        activeMatchLeft = null;
        saveState();
        renderQuiz();
        showView("quiz");
    }

    // ---------- Renderizado del cuestionario ----------

    function renderQuiz() {
        const quiz = currentQuiz();
        const question = quiz[state.currentIndex];
        if (!question) {
            state.view = "setup";
            saveState();
            renderSetup();
            showView("setup");
            return;
        }

        const answered = quiz.filter((item) => isAnswered(item, state.responses[item.id])).length;
        const position = state.currentIndex + 1;
        const progress = (position / quiz.length) * 100;
        elements.quizModeLabel.textContent = state.config.mode === "exam" ? t("quiz.examMode") : t("quiz.practiceMode");
        elements.progressText.textContent = t("quiz.progress", { current: position, total: quiz.length });
        elements.answeredText.textContent = t("quiz.answered", { count: answered });
        elements.progressFill.style.width = `${progress}%`;
        elements.progressTrack.setAttribute("aria-valuenow", String(Math.round(progress)));
        renderQuestionMap(quiz);
        renderQuestion(question, position);
        renderQuestionControls(quiz.length);
        saveState();
    }

    function renderQuestionMap(quiz) {
        elements.questionNav.replaceChildren();
        quiz.forEach((question, index) => {
            const button = create("button", "nav-question", String(index + 1));
            button.type = "button";
            button.setAttribute("aria-label", t("quiz.goTo", { number: index + 1 }));
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

    function renderQuestion(question, position) {
        const evaluation = state.evaluations[question.id];
        elements.questionNumber.textContent = t("quiz.question", { number: position });
        elements.questionCategory.textContent = categoryOf(question);
        elements.questionType.textContent = typeLabel(question.type);
        elements.questionContent.replaceChildren();
        elements.feedback.replaceChildren();

        if (question.scenario) {
            elements.scenario.hidden = false;
            elements.scenario.replaceChildren(
                create("strong", "", t("quiz.scenario")),
                create("p", "", question.scenario),
            );
        } else {
            elements.scenario.hidden = true;
            elements.scenario.replaceChildren();
        }

        if (question.type !== "fill-blank") {
            elements.questionContent.append(create("h2", "question-prompt", question.question));
        } else {
            elements.questionContent.append(create("h2", "question-prompt", t("quiz.completeStatement")));
        }
        if (question.description)
            elements.questionContent.append(create("p", "question-description", question.description));

        switch (question.type) {
            case "multiple-choice":
            case "scenario":
                renderOptionQuestion(question, false, evaluation);
                break;
            case "multiple-response":
                renderOptionQuestion(question, true, evaluation);
                break;
            case "true-false":
                renderOptionQuestion(question, false, evaluation, true);
                break;
            case "matching":
                renderMatchingQuestion(question, evaluation);
                break;
            case "fill-blank":
                renderFillQuestion(question, evaluation);
                break;
        }
        if (evaluation) renderFeedback(question, evaluation);
    }

    function renderOptionQuestion(question, multiple, evaluation, isTrueFalse = false) {
        const wrapper = create("div", `answer-options${isTrueFalse ? " true-false-options" : ""}`);
        const response = state.responses[question.id];
        question.options.forEach((option, index) => {
            const label = create("label", "answer-option");
            const input = document.createElement("input");
            input.type = multiple ? "checkbox" : "radio";
            input.name = `answer-${question.id}`;
            input.value = option.id;
            input.checked = multiple ? Array.isArray(response) && response.includes(option.id) : response === option.id;
            input.disabled = Boolean(evaluation);
            if (evaluation) {
                label.classList.add("is-locked");
                if (question.correctAnswers.includes(option.id)) label.classList.add("correct-answer");
                else if (input.checked) label.classList.add("incorrect-answer");
            }
            input.addEventListener("change", () => {
                if (multiple) {
                    const selected = $$("input:checked", wrapper).map((control) => control.value);
                    state.responses[question.id] = selected;
                } else state.responses[question.id] = option.id;
                delete state.evaluations[question.id];
                saveState();
                renderQuestionMap(currentQuiz());
            });
            if (!isTrueFalse)
                label.append(
                    input,
                    create("span", "option-key", String.fromCharCode(65 + index)),
                    create("span", "option-copy", option.text),
                );
            else label.append(input, create("span", "option-copy", option.text));
            wrapper.append(label);
        });
        elements.questionContent.append(wrapper);
    }

    function renderMatchingQuestion(question, evaluation) {
        const instruction = create("p", "matching-instruction", t("quiz.matchInstruction"));
        const board = create("div", "matching-board");
        board.dataset.questionId = question.id;
        const leftColumn = create("div", "match-column");
        const rightColumn = create("div", "match-column");
        const leftItems = orderedMatchingItems(question, "left");
        const rightItems = orderedMatchingItems(question, "right");
        leftColumn.append(create("h3", "", t("quiz.item")));
        rightColumn.append(create("h3", "", t("quiz.match")));
        const response =
            state.responses[question.id] && typeof state.responses[question.id] === "object"
                ? state.responses[question.id]
                : {};

        leftItems.forEach((item) => {
            const button = create("button", "match-item", item.text);
            button.type = "button";
            button.dataset.side = "left";
            button.dataset.itemId = item.id;
            if (activeMatchLeft?.questionId === question.id && activeMatchLeft.leftId === item.id)
                button.classList.add("is-selected");
            if (response[item.id]) button.classList.add("is-connected");
            applyMatchEvaluationClass(button, item.id, response[item.id], question, evaluation);
            button.disabled = Boolean(evaluation);
            button.setAttribute(
                "aria-pressed",
                String(activeMatchLeft?.questionId === question.id && activeMatchLeft.leftId === item.id),
            );
            button.addEventListener("click", () => {
                activeMatchLeft = { questionId: question.id, leftId: item.id };
                renderQuestion(question, state.currentIndex + 1);
            });
            leftColumn.append(button);
        });

        rightItems.forEach((item) => {
            const button = create("button", "match-item", item.text);
            button.type = "button";
            button.dataset.side = "right";
            button.dataset.itemId = item.id;
            if (Object.values(response).includes(item.id)) button.classList.add("is-connected");
            if (evaluation) {
                const leftId = Object.keys(response).find((key) => response[key] === item.id);
                if (leftId) applyMatchEvaluationClass(button, leftId, item.id, question, evaluation);
            }
            button.disabled = Boolean(evaluation);
            button.addEventListener("click", () => connectMatch(question, item.id));
            rightColumn.append(button);
        });

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("matching-lines");
        svg.setAttribute("aria-hidden", "true");
        board.append(svg, leftColumn, rightColumn);
        elements.questionContent.append(instruction, board);

        const connectionList = create("div", "connection-list");
        leftItems.forEach((left) => {
            const rightId = response[left.id];
            if (!rightId) return;
            const right = question.rightItems.find((item) => item.id === rightId);
            if (!left || !right) return;
            const chip = create("span", "connection-chip");
            chip.append(create("span", "", `${left.text} → ${right.text}`));
            if (!evaluation) {
                const remove = create("button", "", "×");
                remove.type = "button";
                remove.setAttribute("aria-label", t("quiz.removeConnection", { left: left.text, right: right.text }));
                remove.addEventListener("click", () => removeMatch(question, left.id));
                chip.append(remove);
            }
            connectionList.append(chip);
        });
        elements.questionContent.append(connectionList);
        window.requestAnimationFrame(drawMatchingLines);
    }

    function connectMatch(question, rightId) {
        if (!activeMatchLeft || activeMatchLeft.questionId !== question.id) {
            showToast(t("quiz.selectLeftFirst"));
            return;
        }
        const response = { ...(state.responses[question.id] || {}) };
        Object.keys(response).forEach((leftId) => {
            if (response[leftId] === rightId) delete response[leftId];
        });
        response[activeMatchLeft.leftId] = rightId;
        state.responses[question.id] = response;
        delete state.evaluations[question.id];
        activeMatchLeft = null;
        saveState();
        renderQuiz();
    }

    function removeMatch(question, leftId) {
        const response = { ...(state.responses[question.id] || {}) };
        delete response[leftId];
        state.responses[question.id] = response;
        delete state.evaluations[question.id];
        saveState();
        renderQuiz();
    }

    function applyMatchEvaluationClass(button, leftId, rightId, question, evaluation) {
        if (!evaluation || !rightId) return;
        button.classList.add(question.correctMatches[leftId] === rightId ? "match-correct" : "match-incorrect");
    }

    function drawMatchingLines() {
        const board = $(".matching-board");
        if (!board) return;
        const question = state.bank.find((item) => item.id === board.dataset.questionId);
        const svg = $(".matching-lines", board);
        if (!question || !svg) return;
        svg.replaceChildren();
        const boardRect = board.getBoundingClientRect();
        const response = state.responses[question.id] || {};
        Object.entries(response).forEach(([leftId, rightId]) => {
            const left = $$('[data-side="left"]', board).find((item) => item.dataset.itemId === leftId);
            const right = $$('[data-side="right"]', board).find((item) => item.dataset.itemId === rightId);
            if (!left || !right) return;
            const leftRect = left.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            const startX = leftRect.right - boardRect.left;
            const startY = leftRect.top + leftRect.height / 2 - boardRect.top;
            const endX = rightRect.left - boardRect.left;
            const endY = rightRect.top + rightRect.height / 2 - boardRect.top;
            const bend = Math.max((endX - startX) * 0.45, 18);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute(
                "d",
                `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
            );
            const evaluation = state.evaluations[question.id];
            if (evaluation)
                path.classList.add(question.correctMatches[leftId] === rightId ? "match-correct" : "match-incorrect");
            svg.append(path);
        });
    }

    function renderFillQuestion(question, evaluation) {
        elements.questionContent.append(create("p", "blank-instruction", t("quiz.blankInstruction")));
        const container = create("div", "fill-text");
        const response =
            state.responses[question.id] && typeof state.responses[question.id] === "object"
                ? state.responses[question.id]
                : {};
        const regex = /{{\s*([\w-]+)\s*}}/g;
        let cursor = 0;
        let match;
        while ((match = regex.exec(question.question)) !== null) {
            container.append(document.createTextNode(question.question.slice(cursor, match.index)));
            const blankId = match[1];
            const blank = question.blanks.find((item) => item.id === blankId);
            if (blank) {
                const select = document.createElement("select");
                select.className = "blank-select";
                select.setAttribute("aria-label", t("quiz.blankAnswer", { id: blankId }));
                select.add(new Option(t("quiz.select"), ""));
                blank.options.forEach((option) => select.add(new Option(option, option)));
                select.value = response[blankId] || "";
                select.disabled = Boolean(evaluation);
                if (evaluation)
                    select.classList.add(
                        response[blankId] === blank.correctAnswer ? "blank-correct" : "blank-incorrect",
                    );
                select.addEventListener("change", () => {
                    state.responses[question.id] = { ...(state.responses[question.id] || {}), [blankId]: select.value };
                    delete state.evaluations[question.id];
                    saveState();
                    renderQuestionMap(currentQuiz());
                });
                container.append(select);
            } else container.append(document.createTextNode(match[0]));
            cursor = regex.lastIndex;
        }
        container.append(document.createTextNode(question.question.slice(cursor)));
        elements.questionContent.append(container);
    }

    function renderFeedback(question, evaluation) {
        const box = create("div", `feedback ${evaluation.correct ? "correct" : "incorrect"}`);
        box.append(create("strong", "", evaluation.correct ? t("quiz.correct") : t("quiz.incorrect")));
        box.append(create("p", "", evaluation.correct ? t("quiz.selectedExpected") : t("quiz.reviewSolution")));
        if (state.config.immediateExplanation && question.explanation) {
            box.append(create("p", "explanation", question.explanation));
        }
        elements.feedback.append(box);
    }

    function renderQuestionControls(total) {
        elements.previous.disabled = state.currentIndex === 0;
        elements.next.hidden = state.currentIndex === total - 1;
        elements.checkQuestion.hidden = state.config.mode === "exam";
        elements.checkQuestion.disabled = Boolean(state.evaluations[currentQuestion().id]);
        elements.finish.hidden = false;
        elements.finish.textContent = state.config.mode === "exam" ? t("quiz.finishExam") : t("quiz.checkAll");
    }

    // ---------- Navigation and grading ----------

    function goToQuestion(index) {
        if (index < 0 || index >= state.quizIds.length) return;
        state.currentIndex = index;
        activeMatchLeft = null;
        renderQuiz();
        $("#question-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function checkCurrentQuestion() {
        const question = currentQuestion();
        if (!isAnswered(question, state.responses[question.id])) {
            showToast(t("quiz.answerBeforeCheck"));
            return;
        }
        state.evaluations[question.id] = { correct: evaluateQuestion(question, state.responses[question.id]) };
        activeMatchLeft = null;
        saveState();
        renderQuiz();
    }

    function finishQuiz() {
        const quiz = currentQuiz();
        const answered = quiz.filter((question) => isAnswered(question, state.responses[question.id])).length;
        if (answered < quiz.length) {
            const missing = quiz.length - answered;
            const proceed = window.confirm(t("quiz.finishUnanswered", { count: missing }));
            if (!proceed) return;
        }
        quiz.forEach((question) => {
            state.evaluations[question.id] = { correct: evaluateQuestion(question, state.responses[question.id]) };
        });
        state.completed = true;
        state.view = "results";
        saveState();
        renderResults();
        showView("results");
    }

    function evaluateQuestion(question, response) {
        if (!isAnswered(question, response)) return false;
        if (["multiple-choice", "true-false", "scenario"].includes(question.type))
            return response === question.correctAnswers[0];
        if (question.type === "multiple-response") return sameSet(response, question.correctAnswers);
        if (question.type === "matching") {
            return (
                question.leftItems.every((item) => response[item.id] === question.correctMatches[item.id]) &&
                Object.keys(response).length === question.leftItems.length
            );
        }
        if (question.type === "fill-blank")
            return question.blanks.every((blank) => response[blank.id] === blank.correctAnswer);
        return false;
    }

    function isAnswered(question, response) {
        if (response === undefined || response === null) return false;
        if (["multiple-choice", "true-false", "scenario"].includes(question.type)) return isNonEmptyString(response);
        if (question.type === "multiple-response") return Array.isArray(response) && response.length > 0;
        if (question.type === "matching")
            return response && question.leftItems.every((item) => isNonEmptyString(response[item.id]));
        if (question.type === "fill-blank")
            return response && question.blanks.every((blank) => isNonEmptyString(response[blank.id]));
        return false;
    }

    function resetQuizAnswers() {
        if (!window.confirm(t("quiz.resetConfirm"))) return;
        state.responses = {};
        state.evaluations = {};
        state.currentIndex = 0;
        state.completed = false;
        activeMatchLeft = null;
        saveState();
        renderQuiz();
        showToast(t("quiz.answersReset"));
    }

    function renderResults() {
        const quiz = currentQuiz();
        const correct = quiz.filter((question) => state.evaluations[question.id]?.correct).length;
        const answered = quiz.filter((question) => isAnswered(question, state.responses[question.id])).length;
        const incorrect = quiz.length - correct;
        const percentage = quiz.length ? Math.round((correct / quiz.length) * 100) : 0;
        const wrong = quiz.filter((question) => !state.evaluations[question.id]?.correct);

        elements.scoreValue.textContent = `${percentage}%`;
        elements.scoreRing.style.setProperty("--score-angle", `${percentage * 3.6}deg`);
        elements.resultsMessage.textContent = resultMessage(percentage);
        elements.correctCount.textContent = String(correct);
        elements.incorrectCount.textContent = String(incorrect);
        elements.answeredCount.textContent = String(answered);
        elements.wrongBadge.textContent = t("results.missed", { count: wrong.length });
        elements.wrongBadge.className = `status-badge ${wrong.length ? "" : "status-ready"}`;
        elements.retryWrong.hidden = wrong.length === 0;
        elements.wrongQuestions.replaceChildren();

        if (!wrong.length) {
            const empty = create("div", "empty-review");
            empty.append(create("strong", "", t("results.perfect")), create("span", "", t("results.noReview")));
            elements.wrongQuestions.append(empty);
            return;
        }

        wrong.forEach((question) => {
            const item = create("article", "wrong-item");
            const header = document.createElement("header");
            header.append(create("span", "", typeLabel(question.type)), create("small", "tag", categoryOf(question)));
            item.append(header, create("h3", "", question.question));
            item.append(
                create(
                    "p",
                    "",
                    t("results.yourAnswer", { answer: formatResponse(question, state.responses[question.id]) }),
                ),
            );
            item.append(create("p", "", t("results.correctAnswer", { answer: formatCorrectAnswer(question) })));
            if (question.explanation) item.append(create("p", "", question.explanation));
            elements.wrongQuestions.append(item);
        });
    }

    function retryWrongQuestions() {
        const wrongIds = state.quizIds.filter((id) => !state.evaluations[id]?.correct);
        if (!wrongIds.length) return;
        const wrongQuestions = wrongIds
            .map((id) => state.bank.find((question) => question.id === id))
            .filter(Boolean);
        state.quizIds = wrongIds;
        state.matchingOrders = createMatchingOrders(wrongQuestions, state.matchingOrders);
        state.config.count = wrongIds.length;
        state.config.mode = "practice";
        state.responses = {};
        state.evaluations = {};
        state.currentIndex = 0;
        state.completed = false;
        state.view = "quiz";
        saveState();
        renderQuiz();
        showView("quiz");
    }

    // ---------- Interfaz general ----------

    function showView(name) {
        state.view = name;
        elements.views.forEach((view) => {
            view.hidden = view.id !== `${name}-view`;
        });
        if (name === "setup") renderSetup();
        if (name === "quiz") renderQuiz();
        if (name === "results") renderResults();
        saveState();
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.setTimeout(() => {
            const heading = $(`#${name}-view h1`);
            if (heading) {
                heading.setAttribute("tabindex", "-1");
                heading.focus({ preventScroll: true });
            }
        }, 80);
    }

    function applyTheme() {
        document.documentElement.dataset.theme = state.theme;
        const isDark = state.theme === "dark";
        elements.themeIcon.textContent = isDark ? "☀" : "☾";
        elements.themeToggle.setAttribute(
            "aria-label",
            isDark ? t("header.enableLightMode") : t("header.enableDarkMode"),
        );
    }

    function toggleTheme() {
        state.theme = state.theme === "dark" ? "light" : "dark";
        applyTheme();
        saveState();
    }

    function setMessage(container, kind, messages, footer = "") {
        container.replaceChildren();
        container.className = `message ${kind}`;
        if (messages.length === 1) container.append(document.createTextNode(messages[0]));
        else {
            container.append(create("strong", "", t("validation.foundIssues", { count: messages.length })));
            const list = document.createElement("ul");
            messages.forEach((message) => list.append(create("li", "", message)));
            container.append(list);
        }
        if (footer) container.append(create("p", "", footer));
        container.hidden = false;
    }

    function clearMessage(container) {
        container.hidden = true;
        container.replaceChildren();
        container.className = "message";
    }

    function showToast(message) {
        window.clearTimeout(toastTimer);
        elements.toast.textContent = message;
        elements.toast.hidden = false;
        toastTimer = window.setTimeout(() => {
            elements.toast.hidden = true;
        }, 3000);
    }

    function create(tag, className = "", text = "") {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== "") element.textContent = text;
        return element;
    }

    function countBy(items, keyFn) {
        return items.reduce((result, item) => {
            const key = keyFn(item);
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});
    }

    function categoryOf(question) {
        return question.category || t("category.uncategorized");
    }

    function uniqueCategories(questions) {
        return [...new Set(questions.map(categoryOf))].sort((a, b) => a.localeCompare(b, currentLocale));
    }

    function shuffle(items) {
        for (let index = items.length - 1; index > 0; index -= 1) {
            const other = Math.floor(Math.random() * (index + 1));
            [items[index], items[other]] = [items[other], items[index]];
        }
        return items;
    }

    function shuffledIds(items, previousIds = []) {
        const ids = items.map((item) => item.id);
        if (ids.length < 2) return ids;
        let randomized = shuffle([...ids]);
        if (ids.length > 1 && randomized.every((id, index) => id === previousIds[index])) {
            [randomized[0], randomized[1]] = [randomized[1], randomized[0]];
        }
        return randomized;
    }

    function createMatchingOrders(questions, previousOrders = {}) {
        return questions.reduce((orders, question) => {
            if (question.type !== "matching") return orders;
            const previous = previousOrders[question.id] || {};
            orders[question.id] = {
                left: shuffledIds(question.leftItems, previous.left),
                right: shuffledIds(question.rightItems, previous.right),
            };
            return orders;
        }, {});
    }

    function orderedMatchingItems(question, side) {
        const source = side === "left" ? question.leftItems : question.rightItems;
        const configuredIds = state.matchingOrders?.[question.id]?.[side];
        if (!Array.isArray(configuredIds)) return source;
        const byId = new Map(source.map((item) => [item.id, item]));
        const ordered = configuredIds.map((id) => byId.get(id)).filter(Boolean);
        source.forEach((item) => {
            if (!ordered.includes(item)) ordered.push(item);
        });
        return ordered;
    }

    function sameSet(left, right) {
        return Array.isArray(left) && left.length === right.length && left.every((value) => right.includes(value));
    }

    function resultMessage(percentage) {
        if (percentage === 100) return t("results.message.full");
        if (percentage >= 80) return t("results.message.great");
        if (percentage >= 60) return t("results.message.track");
        return t("results.message.focus");
    }

    function formatResponse(question, response) {
        if (!isAnswered(question, response)) return t("format.unanswered");
        if (["multiple-choice", "true-false", "scenario"].includes(question.type)) {
            return question.options.find((option) => option.id === response)?.text || String(response);
        }
        if (question.type === "multiple-response") {
            return response.map((id) => question.options.find((option) => option.id === id)?.text || id).join("; ");
        }
        if (question.type === "matching") {
            return question.leftItems
                .map((left) => {
                    const right = question.rightItems.find((item) => item.id === response[left.id]);
                    return `${left.text} → ${right?.text || t("format.noMatch")}`;
                })
                .join("; ");
        }
        if (question.type === "fill-blank") {
            return question.blanks
                .map((blank) => `${blank.id}: ${response[blank.id] || t("format.unanswered")}`)
                .join("; ");
        }
        return t("format.unanswered");
    }

    function formatCorrectAnswer(question) {
        if (["multiple-choice", "multiple-response", "true-false", "scenario"].includes(question.type)) {
            return question.correctAnswers
                .map((id) => question.options.find((option) => option.id === id)?.text || id)
                .join("; ");
        }
        if (question.type === "matching") {
            return question.leftItems
                .map((left) => {
                    const right = question.rightItems.find((item) => item.id === question.correctMatches[left.id]);
                    return `${left.text} → ${right?.text || question.correctMatches[left.id]}`;
                })
                .join("; ");
        }
        if (question.type === "fill-blank") {
            return question.blanks.map((blank) => `${blank.id}: ${blank.correctAnswer}`).join("; ");
        }
        return t("format.noAnswer");
    }

    // ---------- Eventos e inicio ----------

    function bindEvents() {
        elements.languageSelect.addEventListener("change", () => setLocale(elements.languageSelect.value));
        elements.themeToggle.addEventListener("click", toggleTheme);
        elements.clearSession.addEventListener("click", clearSavedSession);
        elements.brandLink.addEventListener("click", (event) => {
            event.preventDefault();
            if (state.bank.length) showView("setup");
            else showView("import");
        });
        elements.loadDemo.addEventListener("click", () => {
            elements.jsonInput.value = JSON.stringify(DEMO_BANK, null, 2);
            setMessage(elements.importMessage, "success", [t("toast.demoPrepared")]);
        });
        elements.validateLoad.addEventListener("click", parseAndLoadInput);
        elements.fileInput.addEventListener("change", () => readQuestionFile(elements.fileInput.files[0]));
        ["dragenter", "dragover"].forEach((eventName) =>
            elements.fileDrop.addEventListener(eventName, (event) => {
                event.preventDefault();
                elements.fileDrop.classList.add("is-dragging");
            }),
        );
        ["dragleave", "drop"].forEach((eventName) =>
            elements.fileDrop.addEventListener(eventName, (event) => {
                event.preventDefault();
                elements.fileDrop.classList.remove("is-dragging");
            }),
        );
        elements.fileDrop.addEventListener("drop", (event) => readQuestionFile(event.dataTransfer.files[0]));
        elements.changeSource.addEventListener("click", () => showView("import"));
        elements.configForm.addEventListener("submit", startQuiz);
        elements.categoryFilter.addEventListener("change", () => {
            const available = state.bank.filter(
                (question) =>
                    elements.categoryFilter.value === "all" || categoryOf(question) === elements.categoryFilter.value,
            ).length;
            elements.questionCount.max = String(available);
            elements.questionCount.value = String(Math.min(Number(elements.questionCount.value) || 1, available));
        });
        elements.previous.addEventListener("click", () => goToQuestion(state.currentIndex - 1));
        elements.next.addEventListener("click", () => goToQuestion(state.currentIndex + 1));
        elements.checkQuestion.addEventListener("click", checkCurrentQuestion);
        elements.finish.addEventListener("click", finishQuiz);
        elements.resetAnswers.addEventListener("click", resetQuizAnswers);
        elements.exitQuiz.addEventListener("click", () => showView("setup"));
        elements.retryWrong.addEventListener("click", retryWrongQuestions);
        elements.newSession.addEventListener("click", () => showView("setup"));
        window.addEventListener("resize", () => window.requestAnimationFrame(drawMatchingLines));
        document.addEventListener("keydown", (event) => {
            if (state.view !== "quiz" || ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName))
                return;
            if (event.key === "ArrowLeft") goToQuestion(state.currentIndex - 1);
            if (event.key === "ArrowRight") goToQuestion(state.currentIndex + 1);
        });
    }

    function init() {
        const restored = loadSavedState();
        bindEvents();
        applyTheme();
        applyLocale({ rerender: false });
        if (state.view === "setup" && state.bank.length) renderSetup();
        if (state.view === "quiz" && state.quizIds.length) renderQuiz();
        if (state.view === "results" && state.quizIds.length) renderResults();
        showView(state.view);
        if (restored && state.bank.length) window.setTimeout(() => showToast(t("toast.restored")), 250);
    }
    init();
})();
