/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.i18n = { create({ storage, preferences, locales }) {
    const supportedLocales = ["en", "es", "fr"];
    const storageKey = "certprep.locale.v1";

    function normalizeLocale(value) {
        const language = String(value || "")
            .toLowerCase()
            .split(/[-_]/)[0];
        return supportedLocales.includes(language) ? language : null;
    }

    function detectInitialLocale() {
        try {
            const saved = normalizeLocale(storage.read(storageKey));
            if (saved) return saved;
        } catch (error) {
            // Continue with browser preferences when storage is unavailable.
        }
        return preferences.map(normalizeLocale).find(Boolean) || "en";
    }

    function setLocale(value) {
        const locale = normalizeLocale(value) || "en";
        try {
            storage.write(storageKey, locale);
        } catch (error) {
            // The interface remains usable when storage is unavailable.
        }
        return locale;
    }

    function translate(key, currentLocale, variables = {}) {
        const table = locales[currentLocale] || locales.en || {};
        const fallback = locales.en?.[key] ?? key;
        const value = table[key] ?? fallback;
        const text = typeof value === "function" ? value(variables) : value;
        return String(text).replace(/\{(\w+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : match,
        );
    }

    return { supportedLocales, normalizeLocale, detectInitialLocale, setLocale, translate };
} };
