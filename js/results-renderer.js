/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
    "use strict";
    const namespace = (window.CertPrep = window.CertPrep || {});
    function create({
        elements,
        getState,
        translate,
        currentQuiz,
        isAnswered,
        formatResponse,
        formatCorrectAnswer,
        typeLabel,
        categoryOf,
        createElement,
    }) {
        function render() {
            const state = getState();
            const quiz = currentQuiz();
            const correct = quiz.filter((question) => state.evaluations[question.id]?.correct).length;
            const answered = quiz.filter((question) => isAnswered(question, state.responses[question.id])).length;
            const incorrect = quiz.length - correct;
            const percentage = quiz.length ? Math.round((correct / quiz.length) * 100) : 0;
            const wrong = quiz.filter((question) => !state.evaluations[question.id]?.correct);
            elements.scoreValue.textContent = `${percentage}%`;
            elements.scoreRing.style.setProperty("--score-angle", `${percentage * 3.6}deg`);
            elements.resultsMessage.textContent = translate(
                `results.message.${percentage === 100 ? "full" : percentage >= 80 ? "great" : percentage >= 60 ? "track" : "focus"}`,
            );
            elements.correctCount.textContent = String(correct);
            elements.incorrectCount.textContent = String(incorrect);
            elements.answeredCount.textContent = String(answered);
            elements.wrongBadge.textContent = translate("results.missed", { count: wrong.length });
            elements.wrongBadge.className = `status-badge ${wrong.length ? "" : "status-ready"}`;
            elements.retryWrong.hidden = wrong.length === 0;
            elements.wrongQuestions.replaceChildren();
            if (!wrong.length) {
                const empty = createElement("div", "empty-review");
                empty.append(
                    createElement("strong", "", translate("results.perfect")),
                    createElement("span", "", translate("results.noReview")),
                );
                elements.wrongQuestions.append(empty);
                return;
            }
            wrong.forEach((question) => {
                const item = createElement("article", "wrong-item");
                const header = createElement("header");
                header.append(
                    createElement("span", "", typeLabel(question.type)),
                    createElement("small", "tag", categoryOf(question)),
                );
                item.append(header, createElement("h3", "", question.question));
                item.append(
                    createElement(
                        "p",
                        "",
                        translate("results.yourAnswer", {
                            answer: formatResponse(question, state.responses[question.id]),
                        }),
                    ),
                );
                item.append(
                    createElement(
                        "p",
                        "",
                        translate("results.correctAnswer", { answer: formatCorrectAnswer(question) }),
                    ),
                );
                if (question.explanation) item.append(createElement("p", "", question.explanation));
                elements.wrongQuestions.append(item);
            });
        }
        return { render };
    }
    namespace.resultsRenderer = { create };
})();
