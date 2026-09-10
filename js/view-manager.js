/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});
    function create({ elements, renderers, platform }) {
        function showView(name) {
            elements.views.forEach((view) => {
                view.hidden = view.id !== `${name}-view`;
            });
            const render = renderers[name];
            if (render) render();
            platform.scrollTo({ top: 0, behavior: "smooth" });
            platform.setTimeout(() => {
                const heading = platform.query(`#${name}-view h1`);
                if (heading) {
                    heading.setAttribute("tabindex", "-1");
                    heading.focus({ preventScroll: true });
                }
            }, 80);
        }
        return { showView };
    }
    namespace.viewManager = { create };
})();
