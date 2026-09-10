/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ importer, maxFileSize, validate, loadBank, translate: t }) {
        function parseAndLoad(raw) {
            if (!raw.trim()) return { ok: false, value: null, error: { code: "empty", messages: [t("import.error.empty")] } };
            const parsed = importer.parse(raw.trim());
            if (!parsed.ok) return { ok: false, value: null, error: {
                code: "parse", messages: [t("import.error.invalidJson", { error: parsed.error.message })],
            } };
            const result = validate(parsed.value);
            if (!result.ok) return { ok: false, value: null, error: {
                code: "validation", messages: result.error.messages.slice(0, 10),
                footer: result.error.messages.length > 10 ? t("import.error.additional", { count: result.error.messages.length - 10 }) : "",
            } };
            return loadBank({ ...parsed.value, title: typeof parsed.value.title === "string" ? parsed.value.title : t("import.importedBank") });
        }
        async function readFile(file) {
            const result = await importer.readFile(file, maxFileSize);
            if (result.ok) return result;
            const key = { extension: "import.error.extension", size: "import.error.size", read: "import.error.read" }[result.error.code];
            return { ok: false, value: null, error: { code: result.error.code, messages: key ? [t(key)] : [] } };
        }
        return { parseAndLoad, readFile };
    }
    window.CertPrep.importController = { create };
})();
