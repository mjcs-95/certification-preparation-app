/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.i18nUI = {
    create({
        elements,
        documentRef: document,
        translate,
        getLocale,
        setLocaleValue,
        getQuestionMapExpanded,
        setQuestionMapExpanded,
        rerender,
    }) {
        function applyStaticTranslations() {
            document.querySelectorAll("[data-i18n]").forEach((element) => {
                element.textContent = translate(element.dataset.i18n);
            });
            document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
                element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
            });
            document.querySelectorAll("[data-i18n-title]").forEach((element) => {
                element.setAttribute("title", translate(element.dataset.i18nTitle));
            });
            document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
                element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder));
            });
            document.documentElement.lang = getLocale();
            document.title = translate("meta.title");
            const description = document.querySelector('meta[name="description"]');
            if (description) description.setAttribute("content", translate("meta.description"));
            if (elements.languageSelect) elements.languageSelect.value = getLocale();
            if (elements.questionMapToggle) setQuestionMapExpanded(getQuestionMapExpanded());
        }

        function applyLocale({ rerender: shouldRerender = true } = {}) {
            applyStaticTranslations();
            if (shouldRerender) rerender();
        }

        function setLocale(value) {
            setLocaleValue(value);
            applyLocale();
        }

        return { applyStaticTranslations, applyLocale, setLocale };
    },
};
