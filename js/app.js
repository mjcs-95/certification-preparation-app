/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    // Composition root: only module construction, dependency wiring and startup.
    const api = window.CertPrep;
    const platform = {
        query: document.querySelector.bind(document),
        createText: document.createTextNode.bind(document),
        createSvg: document.createElementNS.bind(document, "http://www.w3.org/2000/svg"),
        confirm: window.confirm.bind(window),
        setTimeout: window.setTimeout.bind(window),
        clearTimeout: window.clearTimeout.bind(window),
        requestAnimationFrame: window.requestAnimationFrame.bind(window),
        scrollTo: window.scrollTo.bind(window),
        scrollToQuestion: () => document.querySelector("#question-card").scrollIntoView({ behavior: "smooth", block: "start" }),
    };
    const elements = api.domElements.create(document);
    const { create: createElement } = api.domUtils;
    const defaultState = () => api.state.createDefaultState({ prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches });
    const session = api.sessionManager.create({
        key: "certprep.quiz-session.v1", initialState: defaultState(), defaultState, storage: api.storage,
    });
    const getState = session.read;
    const i18n = api.i18n.create({
        storage: api.storage, locales: window.CERTPREP_LOCALES || {},
        preferences: Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language],
    });
    let currentLocale = i18n.detectInitialLocale();
    const translate = (key, variables) => i18n.translate(key, currentLocale, variables);
    const utils = api.questionUtils.create({ randomization: api.randomization });
    const categoryOf = question => utils.categoryOf(question, translate("category.uncategorized"));
    const uniqueCategories = questions => utils.uniqueCategories(questions, translate("category.uncategorized"), currentLocale);
    const typeLabel = type => translate(`type.${type}`);
    const { isAnswered, evaluateQuestion: evaluate } = api.evaluation.create(api.questionTypes);
    const selection = api.quizSelection.create({ shuffle: utils.shuffle, categoryOf });
    const domain = api.quizDomain.create({
        selection, createMatchingOrders: utils.createMatchingOrders, evaluate, isAnswered,
        resetAnswers: api.state.resetAnswers, replaceBank: api.state.replaceBank.bind(api.state),
    });
    const shared = { elements, getState, translate, createElement };
    const messages = api.uiMessages.create({ ...shared, platform });
    const forms = api.formAdapter.create({ elements, query: platform.query });
    const progress = api.quizProgress.create({ getState, isAnswered });
    const format = api.responseFormat.create({ translate, isAnswered });
    const setup = api.setup.create({ ...shared, countBy: utils.countBy, uniqueCategories, forms, clearMessage: messages.clearMessage });
    const theme = api.theme.create({ ...shared, root: document.documentElement, getTheme: () => getState().theme });
    const results = api.resultsRenderer.create({
        ...shared, currentQuiz: progress.currentQuiz, isAnswered,
        formatResponse: format.formatResponse, formatCorrectAnswer: format.formatCorrectAnswer, categoryOf, typeLabel,
    });
    // Late-bound ports resolve the view/action feedback loop without global lookups.
    const renderers = { setup: setup.render, results: results.render, theme: theme.applyTheme };
    let resetMatch;
    const views = api.viewManager.create({ elements, renderers, platform });
    const effects = api.appEffects.create({
        session, platform, elements, translate, showToast: messages.showToast, renderers,
        showView: views.showView, resetMatch: () => resetMatch(),
    });
    const quiz = api.quizController.create({ session, domain, effects, isAnswered });
    const matching = api.matchingController.create({
        getState, answer: quiz.answer, render: () => renderers.quiz(), notify: effects.notify, domain: api.matchingDomain,
    });
    resetMatch = matching.reset;
    const matchingView = api.matchingRenderer.create({
        ...shared, createSvg: platform.createSvg, schedule: platform.requestAnimationFrame, actions: matching,
        orderedMatchingItems: (question, side) => utils.orderedMatchingItems(question, side, getState().matchingOrders),
    });
    const types = api.questionTypeRenderers.create({
        option: api.optionRenderer.create({ ...shared, answer: quiz.answer }),
        fill: api.fillRenderer.create({ ...shared, createText: platform.createText, answer: quiz.answer }),
        matching: matchingView,
    });
    const question = api.questionRenderer.create({ ...shared, categoryOf, typeLabel, renderers: types });
    const questionMap = api.questionMap.create({ ...shared, isAnswered, goToQuestion: quiz.goToQuestion });
    let expanded = !window.matchMedia("(max-width: 920px)").matches;
    const map = {
        getExpanded: () => expanded,
        setExpanded(value) { expanded = value; questionMap.setExpanded(value); },
    };
    const quizView = api.quizView.create({
        ...shared, progress, questionMap, questionRenderer: question, getExpanded: map.getExpanded,
    });
    Object.assign(renderers, { quiz: quizView.render, progress: quizView.renderProgress });
    const locale = api.i18nUI.create({
        elements, translate, documentRef: document, getLocale: () => currentLocale,
        setLocaleValue: value => { currentLocale = i18n.setLocale(value); },
        getQuestionMapExpanded: map.getExpanded, setQuestionMapExpanded: map.setExpanded,
        rerender: () => renderers[getState().view]?.(),
    });
    const validation = api.validation.createValidation(translate);
    const importer = api.importController.create({
        importer: api.importer, maxFileSize: 5 * 1024 * 1024,
        validate: validation.validateQuestionBank, translate, loadBank: quiz.run.bind(null, "bank"),
    });
    const actions = api.appActions.create({
        session, quiz, importer, forms, elements, messages, effects, translate,
        demoBank: api.demoBank, selection, locale, theme, matching: matchingView, platform, map,
    });
    api.optionalBank.create({
        path: "./az-900/ChatGPT_AZ-900_All_Units_Combined_Bank.json",
        label: translate("import.az900Quiz"),
        anchor: elements.loadDemo,
        documentRef: document,
        fetch: typeof window.fetch === "function" ? window.fetch.bind(window) : async () => ({ ok: false }),
        onLoad: actions.loadText,
    }).discover();
    const restored = session.load();
    api.eventBindings.create({
        elements, actions, getState, getQuestionMapExpanded: map.getExpanded,
        isFormControl: element => ["INPUT", "SELECT", "TEXTAREA"].includes(element?.tagName),
        eventTarget: window, keyboardTarget: document, getActiveElement: () => document.activeElement,
    });
    map.setExpanded(expanded);
    theme.applyTheme();
    locale.applyLocale({ rerender: false });
    effects.apply({ view: getState().view, persist: true });
    if (restored.ok && getState().bank.length) platform.setTimeout(effects.notify.bind(null, "toast.restored"), 250);
})();
