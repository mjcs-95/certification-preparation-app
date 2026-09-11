/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ path, label, anchor, documentRef, fetch: fetchBank, onLoad }) {
        async function discover() {
            try {
                const response = await fetchBank(path, { cache: "no-store" });
                if (!response.ok) return { ok: false, value: null, error: { code: "missing" } };
                const text = await response.text();
                JSON.parse(text);
                const button = documentRef.createElement("button");
                button.type = "button";
                button.className = anchor.className;
                button.textContent = label;
                button.addEventListener("click", () => onLoad(text));
                anchor.parentElement.append(button);
                return { ok: true, value: button, error: null };
            } catch (error) {
                return { ok: false, value: null, error: { code: "unavailable", cause: error } };
            }
        }
        return { discover };
    }
    window.CertPrep.optionalBank = { create };
})();
