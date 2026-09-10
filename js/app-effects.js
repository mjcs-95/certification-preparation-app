/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ session, platform, elements, translate: t, showToast, renderers, showView, resetMatch }) {
        let indicatorTimer;
        function save() {
            const result = session.save();
            if (result.ok) {
                elements.saveLabel.textContent = t("header.saved");
                platform.clearTimeout(indicatorTimer);
                indicatorTimer = platform.setTimeout(() => { elements.saveLabel.textContent = t("header.savedLocally"); }, 1200);
            } else showToast(t("toast.sessionSaved"));
            return result;
        }
        function notify(key, variables) { showToast(t(key, variables)); }
        function apply(effect) {
            if (effect.resetMatch) resetMatch();
            if (effect.view) showView(effect.view);
            else if (effect.render) renderers[effect.render]();
            if (effect.persist) save();
            if (effect.scroll) platform.scrollToQuestion();
            if (effect.toast) notify(effect.toast, effect.variables);
        }
        return { apply, save, notify, confirm: (key, variables) => platform.confirm(t(key, variables)) };
    }
    window.CertPrep.appEffects = { create };
})();
