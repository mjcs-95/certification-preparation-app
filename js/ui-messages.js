/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({ elements, translate, createElement, platform }) {
        let toastTimer = null;
        function setMessage(container, kind, messages, footer = "") {
            container.replaceChildren();
            container.className = `message ${kind}`;
            if (messages.length === 1) container.append(platform.createText(messages[0]));
            else {
                container.append(
                    createElement("strong", "", translate("validation.foundIssues", { count: messages.length })),
                );
                const list = createElement("ul");
                messages.forEach((message) => list.append(createElement("li", "", message)));
                container.append(list);
            }
            if (footer) container.append(createElement("p", "", footer));
            container.hidden = false;
        }
        function clearMessage(container) {
            container.hidden = true;
            container.replaceChildren();
            container.className = "message";
        }
        function showToast(message) {
            platform.clearTimeout(toastTimer);
            elements.toast.textContent = message;
            elements.toast.hidden = false;
            toastTimer = platform.setTimeout(() => {
                elements.toast.hidden = true;
            }, 3000);
        }
        return { setMessage, clearMessage, showToast };
    }
    namespace.uiMessages = { create };
})();
