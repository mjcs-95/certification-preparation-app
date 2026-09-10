/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    function create({ elements, getState, translate: t, createElement: create, createSvg, schedule, orderedMatchingItems, actions }) {
        function renderMatchingQuestion(question, evaluation) {
            const state = getState();
            const board = create("div", "matching-board");
            board.dataset.questionId = question.id;
            const left = create("div", "match-column");
            const right = create("div", "match-column");
            const response = state.responses[question.id] || {};
            const leftItems = orderedMatchingItems(question, "left");
            const rightItems = orderedMatchingItems(question, "right");
            left.append(create("h3", "", t("quiz.item")));
            right.append(create("h3", "", t("quiz.match")));
            leftItems.forEach((item) => {
                const button = create("button", "match-item", item.text);
                const active = actions.getActive();
                button.type = "button";
                button.dataset.side = "left";
                button.dataset.itemId = item.id;
                if (active?.questionId === question.id && active.leftId === item.id)
                    button.classList.add("is-selected");
                if (response[item.id]) button.classList.add("is-connected");
                evaluationClass(button, item.id, response[item.id], question, evaluation);
                button.disabled = Boolean(evaluation);
                button.addEventListener("click", () => {
                    actions.select(question.id, item.id);
                });
                left.append(button);
            });
            rightItems.forEach((item) => {
                const button = create("button", "match-item", item.text);
                button.type = "button";
                button.dataset.side = "right";
                button.dataset.itemId = item.id;
                if (Object.values(response).includes(item.id)) button.classList.add("is-connected");
                button.disabled = Boolean(evaluation);
                button.addEventListener("click", () => actions.connect(question, item.id));
                right.append(button);
            });
            const svg = createSvg("svg");
            svg.classList.add("matching-lines");
            svg.setAttribute("aria-hidden", "true");
            board.append(svg, left, right);
            elements.questionContent.append(create("p", "matching-instruction", t("quiz.matchInstruction")), board);
            const list = create("div", "connection-list");
            leftItems.forEach((item) => {
                const rightId = response[item.id];
                if (!rightId) return;
                const target = question.rightItems.find((entry) => entry.id === rightId);
                if (!target) return;
                const chip = create("span", "connection-chip", `${item.text} → ${target.text}`);
                if (!evaluation) {
                    const remove = create("button", "", "×");
                    remove.type = "button";
                    remove.addEventListener("click", () => actions.remove(question, item.id));
                    chip.append(remove);
                }
                list.append(chip);
            });
            elements.questionContent.append(list);
            schedule(drawLines);
        }
        function evaluationClass(button, leftId, rightId, question, evaluation) {
            if (!evaluation || !rightId) return;
            button.classList.add(question.correctMatches[leftId] === rightId ? "match-correct" : "match-incorrect");
        }
        function drawLines() {
            const board = elements.questionContent.querySelector(".matching-board");
            if (!board) return;
            const state = getState();
            const question = state.bank.find((item) => item.id === board.dataset.questionId);
            const svg = board.querySelector(".matching-lines");
            if (!question || !svg) return;
            svg.replaceChildren();
            const boardRect = board.getBoundingClientRect();
            const response = state.responses[question.id] || {};
            Object.entries(response).forEach(([leftId, rightId]) => {
                const left = [...board.querySelectorAll('[data-side="left"]')].find(
                    (item) => item.dataset.itemId === leftId,
                );
                const right = [...board.querySelectorAll('[data-side="right"]')].find(
                    (item) => item.dataset.itemId === rightId,
                );
                if (!left || !right) return;
                const a = left.getBoundingClientRect(),
                    b = right.getBoundingClientRect();
                const startX = a.right - boardRect.left,
                    startY = a.top + a.height / 2 - boardRect.top,
                    endX = b.left - boardRect.left,
                    endY = b.top + b.height / 2 - boardRect.top,
                    bend = Math.max((endX - startX) * 0.45, 18);
                const path = createSvg("path");
                path.setAttribute(
                    "d",
                    `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
                );
                const evaluation = state.evaluations[question.id];
                if (evaluation)
                    path.classList.add(
                        question.correctMatches[leftId] === rightId ? "match-correct" : "match-incorrect",
                    );
                svg.append(path);
            });
        }
        return { render: renderMatchingQuestion, drawLines };
    }
    window.CertPrep.matchingRenderer = { create };
})();
