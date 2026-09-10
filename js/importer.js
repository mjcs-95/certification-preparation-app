/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.importer = {
    parse(text) {
        try {
            return { ok: true, value: JSON.parse(String(text)), error: null };
        } catch (error) {
            return { ok: false, value: null, error: { code: "parse", message: error.message } };
        }
    },
    async readFile(file, maxSize) {
        if (!file) return { ok: false, value: null, error: { code: "missing" } };
        if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json")
            return { ok: false, value: null, error: { code: "extension" } };
        if (file.size > maxSize) return { ok: false, value: null, error: { code: "size" } };
        try {
            return { ok: true, value: await file.text(), error: null };
        } catch (error) {
            return { ok: false, value: null, error: { code: "read", cause: error } };
        }
    },
};
