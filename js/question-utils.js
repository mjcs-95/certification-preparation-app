/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});

    function create({ randomization }) {
        const countBy = (items, keyFn) =>
            items.reduce((result, item) => {
                const key = keyFn(item);
                result[key] = (result[key] || 0) + 1;
                return result;
            }, {});
        const categoryOf = (question, uncategorized = "Uncategorized") => question.category || uncategorized;
        const uniqueCategories = (questions, uncategorized, locale) =>
            [...new Set(questions.map((question) => categoryOf(question, uncategorized)))].sort((a, b) =>
                a.localeCompare(b, locale),
            );
        const shuffle = randomization.shuffle;
        const shuffledIds = randomization.shuffledIds.bind(randomization);
        const createMatchingOrders = (questions, previousOrders = {}) =>
            questions.reduce((orders, question) => {
                if (question.type !== "matching") return orders;
                const previous = previousOrders[question.id] || {};
                orders[question.id] = {
                    left: shuffledIds(question.leftItems, previous.left),
                    right: shuffledIds(question.rightItems, previous.right),
                };
                return orders;
            }, {});
        const orderedMatchingItems = (question, side, configuredOrders = {}) => {
            const source = side === "left" ? question.leftItems : question.rightItems;
            const configuredIds = configuredOrders?.[question.id]?.[side];
            if (!Array.isArray(configuredIds)) return source;
            const byId = new Map(source.map((item) => [item.id, item]));
            const ordered = configuredIds.map((id) => byId.get(id)).filter(Boolean);
            source.forEach((item) => {
                if (!ordered.includes(item)) ordered.push(item);
            });
            return ordered;
        };
        return {
            countBy,
            categoryOf,
            uniqueCategories,
            shuffle,
            shuffledIds,
            createMatchingOrders,
            orderedMatchingItems,
            sameSet: randomization.sameSet,
        };
    }
    namespace.questionUtils = { create };
})();
