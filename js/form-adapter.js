/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ elements, query }) {
        function readConfig() {
            return {
                count: Number.parseInt(elements.questionCount.value, 10),
                category: elements.categoryFilter.value,
                selection: query("input[name='selection']:checked").value,
                mode: query("input[name='mode']:checked").value,
                immediateExplanation: elements.immediateExplanation.checked,
            };
        }
        function writeConfig(config) {
            for (const name of ["mode", "selection"]) {
                const control = query(`input[name="${name}"][value="${config[name]}"]`);
                if (control) control.checked = true;
            }
            elements.immediateExplanation.checked = config.immediateExplanation;
        }
        function limitCount(available) {
            elements.questionCount.max = String(available);
            elements.questionCount.value = String(Math.min(Number(elements.questionCount.value) || 1, available));
        }
        function clearImport() {
            elements.jsonInput.value = "";
            elements.fileInput.value = "";
        }
        return { readConfig, writeConfig, limitCount, clearImport };
    }
    window.CertPrep.formAdapter = { create };
})();
