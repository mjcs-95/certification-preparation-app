/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ elements, root, translate, getTheme }) {
        function applyTheme() {
            const theme = getTheme();
            root.dataset.theme = theme;
            const isDark = theme === "dark";
            elements.themeIcon.textContent = isDark ? "☀" : "☾";
            elements.themeToggle.setAttribute("aria-label",
                translate(isDark ? "header.enableLightMode" : "header.enableDarkMode"));
        }
        return { applyTheme };
    }
    window.CertPrep.theme = { create };
})();
