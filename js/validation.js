/* SPDX-License-Identifier: AGPL-3.0-only */
var certPrepGlobal = typeof window !== "undefined" ? window : globalThis;
certPrepGlobal.CertPrep = certPrepGlobal.CertPrep || {};

certPrepGlobal.CertPrep.validation = (() => {
    function createValidation(translate) {
        const t = translate;
        function validateQuestionBank(data) {
            const errors = [];
            if (!data || typeof data !== "object" || Array.isArray(data)) {
                return { ok: false, value: null, error: { code: "validation", messages: [t("validation.root")] } };
            }
            if (!Array.isArray(data.questions)) {
                return { ok: false, value: null, error: { code: "validation", messages: [t("validation.missingQuestions")] } };
            }
            if (data.questions.length === 0) {
                return { ok: false, value: null, error: { code: "validation", messages: [t("validation.emptyQuestions")] } };
            }

            const knownTypes = new Set([
                "multiple-choice",
                "multiple-response",
                "true-false",
                "scenario",
                "matching",
                "fill-blank",
            ]);
            const seenIds = new Set();

            data.questions.forEach((question, index) => {
                const path = t("validation.question", { number: index + 1 });
                if (!question || typeof question !== "object" || Array.isArray(question)) {
                    errors.push(t("validation.object", { path }));
                    return;
                }
                if (!isNonEmptyString(question.id)) errors.push(t("validation.idRequired", { path }));
                else if (seenIds.has(question.id)) errors.push(t("validation.idDuplicate", { path, id: question.id }));
                else seenIds.add(question.id);

                if (!knownTypes.has(question.type)) {
                    errors.push(t("validation.unknownType", { path, type: String(question.type || "no type") }));
                    return;
                }
                if (!isNonEmptyString(question.question)) errors.push(t("validation.questionRequired", { path }));
                if (question.category !== undefined && !isNonEmptyString(question.category))
                    errors.push(t("validation.categoryText", { path }));
                if (question.explanation !== undefined && typeof question.explanation !== "string")
                    errors.push(t("validation.explanationText", { path }));

                if (["multiple-choice", "multiple-response", "true-false", "scenario"].includes(question.type)) {
                    validateOptionQuestion(question, path, errors);
                }
                if (
                    question.type === "multiple-choice" ||
                    question.type === "true-false" ||
                    question.type === "scenario"
                ) {
                    if (Array.isArray(question.correctAnswers) && question.correctAnswers.length !== 1) {
                        errors.push(t("validation.singleCorrect", { path }));
                    }
                }
                if (
                    question.type === "multiple-response" &&
                    Array.isArray(question.correctAnswers) &&
                    question.correctAnswers.length < 1
                ) {
                    errors.push(t("validation.correctAnswers", { path }));
                }
                if (question.type === "true-false" && Array.isArray(question.options)) {
                    const ids = new Set(question.options.map((option) => option && option.id));
                    if (!ids.has("true") || !ids.has("false") || ids.size !== 2)
                        errors.push(t("validation.trueFalseIds", { path }));
                }
                if (question.type === "scenario" && !isNonEmptyString(question.scenario)) {
                    errors.push(t("validation.scenarioRequired", { path }));
                }
                if (question.type === "matching") validateMatchingQuestion(question, path, errors);
                if (question.type === "fill-blank") validateFillQuestion(question, path, errors);
            });

            return { ok: errors.length === 0, value: errors.length ? null : data, error: errors.length ? { code: "validation", messages: errors } : null };
        }

        function validateOptionQuestion(question, path, errors) {
            if (!Array.isArray(question.options) || question.options.length < 2) {
                errors.push(t("validation.optionsCount", { path }));
                return;
            }
            const optionIds = new Set();
            question.options.forEach((option, optionIndex) => {
                if (!option || !isNonEmptyString(option.id) || !isNonEmptyString(option.text)) {
                    errors.push(t("validation.optionFields", { path, number: optionIndex + 1 }));
                } else if (optionIds.has(option.id)) {
                    errors.push(t("validation.optionDuplicate", { path, id: option.id }));
                } else optionIds.add(option.id);
            });
            if (!Array.isArray(question.correctAnswers) || !question.correctAnswers.length) {
                errors.push(t("validation.answerMissing", { path }));
                return;
            }
            question.correctAnswers.forEach((answer) => {
                if (!optionIds.has(answer)) errors.push(t("validation.answerUnknown", { path, id: answer }));
            });
            if (new Set(question.correctAnswers).size !== question.correctAnswers.length)
                errors.push(t("validation.answerDuplicate", { path }));
        }

        function validateMatchingQuestion(question, path, errors) {
            const leftIds = validateItems(question.leftItems, "leftItems", path, errors);
            const rightIds = validateItems(question.rightItems, "rightItems", path, errors);
            if (
                !question.correctMatches ||
                typeof question.correctMatches !== "object" ||
                Array.isArray(question.correctMatches)
            ) {
                errors.push(t("validation.matchObject", { path }));
                return;
            }
            leftIds.forEach((leftId) => {
                if (!Object.prototype.hasOwnProperty.call(question.correctMatches, leftId))
                    errors.push(t("validation.matchMissing", { path, id: leftId }));
                else if (!rightIds.has(question.correctMatches[leftId]))
                    errors.push(t("validation.matchUnknown", { path, id: leftId }));
            });
            Object.keys(question.correctMatches).forEach((leftId) => {
                if (!leftIds.has(leftId)) errors.push(t("validation.matchLeftUnknown", { path, id: leftId }));
            });
        }

        function validateItems(items, field, path, errors) {
            const ids = new Set();
            if (!Array.isArray(items) || items.length < 2) {
                errors.push(t("validation.itemsCount", { path, field }));
                return ids;
            }
            items.forEach((item, index) => {
                if (!item || !isNonEmptyString(item.id) || !isNonEmptyString(item.text))
                    errors.push(t("validation.itemFields", { path, field, number: index }));
                else if (ids.has(item.id)) errors.push(t("validation.itemDuplicate", { path, id: item.id, field }));
                else ids.add(item.id);
            });
            return ids;
        }

        function validateFillQuestion(question, path, errors) {
            if (!Array.isArray(question.blanks) || !question.blanks.length) {
                errors.push(t("validation.blanksMissing", { path }));
                return;
            }
            const blankIds = new Set();
            question.blanks.forEach((blank, index) => {
                if (!blank || !isNonEmptyString(blank.id)) {
                    errors.push(t("validation.blankId", { path, number: index }));
                    return;
                }
                if (blankIds.has(blank.id)) errors.push(t("validation.blankDuplicate", { path, id: blank.id }));
                blankIds.add(blank.id);
                if (!Array.isArray(blank.options) || blank.options.length < 2 || !blank.options.every(isNonEmptyString))
                    errors.push(t("validation.blankOptions", { path, id: blank.id }));
                if (!isNonEmptyString(blank.correctAnswer) || !blank.options?.includes(blank.correctAnswer))
                    errors.push(t("validation.blankAnswer", { path, id: blank.id }));
                if (!question.question.includes(`{{${blank.id}}}`))
                    errors.push(t("validation.blankMarkerMissing", { path, id: blank.id }));
            });
            const markers = Array.from(question.question.matchAll(/{{\s*([\w-]+)\s*}}/g), (match) => match[1]);
            markers.forEach((marker) => {
                if (!blankIds.has(marker)) errors.push(t("validation.blankMarkerUnknown", { path, id: marker }));
            });
        }

        function isNonEmptyString(value) {
            return typeof value === "string" && value.trim().length > 0;
        }

        return { validateQuestionBank, isNonEmptyString };
    }
    return { createValidation };
})();
