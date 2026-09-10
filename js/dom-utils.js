/*
  SPDX-License-Identifier: AGPL-3.0-only
  Copyright (c) 2026 mjcs-95 and contributors
*/
(() => {
    "use strict";

    const namespace = (window.CertPrep = window.CertPrep || {});

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const create = (tag, className = "", text = "") => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== "") element.textContent = text;
        return element;
    };

    namespace.domUtils = { $, $$, create };
})();
