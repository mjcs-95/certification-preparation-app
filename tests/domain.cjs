/* SPDX-License-Identifier: AGPL-3.0-only */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const context = { window: { CertPrep: {} } };
vm.createContext(context);
for (const name of ["state", "randomization", "question-utils", "quiz-selection", "question-types",
    "evaluation", "quiz-domain", "session-manager", "quiz-controller", "matching-domain",
    "matching-controller", "importer", "validation", "import-controller", "demo-bank"]) {
    const source = fs.readFileSync(path.join(root, "js", name + ".js"), "utf8");
    assert(!/\bdocument\b/.test(source), name + " must work without DOM");
    vm.runInContext(source, context, { filename: name + ".js" });
}
const api = context.window.CertPrep;
const defaults = api.state.createDefaultState;
const memory = new Map();
let writes = 0, rejectWrites = false, confirmed = true;
const storage = {
    read: key => memory.get(key) ?? null,
    write(key, value) { if (rejectWrites) return false; writes++; memory.set(key, value); return true; },
    remove: key => memory.delete(key),
};
const session = api.sessionManager.create({ key: "quiz", initialState: defaults(), defaultState: defaults, storage });
const utils = api.questionUtils.create({ randomization: api.randomization });
const selection = api.quizSelection.create({ shuffle: utils.shuffle, categoryOf: utils.categoryOf });
const evaluation = api.evaluation.create(api.questionTypes);
const domain = api.quizDomain.create({
    selection, createMatchingOrders: utils.createMatchingOrders,
    evaluate: evaluation.evaluateQuestion, isAnswered: evaluation.isAnswered,
    resetAnswers: api.state.resetAnswers, replaceBank: api.state.replaceBank.bind(api.state),
});
const effects = { confirm: () => confirmed, apply(effect) { if (effect.persist) session.save(); } };
const quiz = api.quizController.create({ session, domain, effects, isAnswered: evaluation.isAnswered });
const bank = api.demoBank.questions;
assert(quiz.run("bank", { questions: bank, title: "Demo" }).ok);
assert(Object.isFrozen(session.read().bank[0]));
assert.throws(() => { session.read().responses.bad = "response"; }, TypeError);
const before = session.read();
assert(!quiz.startQuiz({ ...before.config, count: 0 }).ok);
assert.equal(session.read(), before, "Rejected commands preserve the snapshot");
assert(quiz.startQuiz({ ...before.config, count: bank.length }).ok);
assert.equal(before.quizIds.length, 0, "Transitions do not mutate earlier snapshots");
const first = session.read().bank.find(q => q.id === session.read().quizIds[0]);
assert(quiz.answer({ id: first.id, response: first.correctAnswers[0] }).ok);
assert(quiz.checkCurrentQuestion().ok);
assert(!quiz.answer({ id: first.id, response: "changed" }).ok, "Checked responses are locked");
const checked = session.read();
confirmed = false;
assert.equal(quiz.finishQuiz().error.code, "cancelled");
assert.equal(quiz.resetQuizAnswers().error.code, "cancelled");
assert.equal(session.read(), checked);
confirmed = true;
assert(quiz.finishQuiz().ok);
assert.equal(session.read().view, "results");
assert(quiz.retryWrongQuestions().ok);
assert(!session.read().quizIds.includes(first.id));
assert.equal(session.read().config.mode, "practice");
assert.equal(Object.keys(session.read().responses).length, 0);
const serialized = JSON.stringify(session.read());
session.save();
session.replace(defaults());
assert(session.load().ok);
assert.equal(JSON.stringify(session.read()), serialized);
rejectWrites = true;
assert.equal(session.save().error.code, "storage");
rejectWrites = false;
const match = bank.find(q => q.type === "matching");
const response = api.matchingDomain.connect({}, match.leftItems[0].id, match.rightItems[0].id);
const reassigned = api.matchingDomain.connect(response, match.leftItems[1].id, match.rightItems[0].id);
assert.equal(Object.keys(reassigned).length, 1, "Matching is one-to-one");
assert.equal(Object.keys(response).length, 1, "Matching preserves its input");
assert.equal(Object.keys(api.matchingDomain.remove(reassigned, match.leftItems[1].id)).length, 0);
assert(quiz.run("bank", { questions: [match], title: "Matching" }).ok);
assert(quiz.startQuiz({ ...session.read().config, count: 1, category: "all" }).ok);
const previousOrder = JSON.stringify(session.read().matchingOrders[match.id]);
assert(quiz.startQuiz({ ...session.read().config, count: 1 }).ok);
assert.notEqual(JSON.stringify(session.read().matchingOrders[match.id]), previousOrder);
const oldWrites = writes;
const matching = api.matchingController.create({
    getState: session.read, answer: quiz.answer, render() {}, notify() {}, domain: api.matchingDomain,
});
assert.equal(matching.connect(match, match.rightItems[0].id).error.code, "missing-left");
assert.equal(writes, oldWrites);
matching.select(match.id, match.leftItems[0].id);
assert(matching.connect(match, match.rightItems[0].id).ok);
assert.equal(matching.getActive(), null);
assert(matching.remove(match, match.leftItems[0].id).ok);
const validation = api.validation.createValidation(key => key);
const importer = api.importController.create({
    importer: api.importer, maxFileSize: 100, validate: validation.validateQuestionBank,
    translate: key => key, loadBank: quiz.run.bind(null, "bank"),
});
for (const raw of ["", "{", "{}", '{"questions":[]}']) {
    const current = session.read();
    assert.equal(importer.parseAndLoad(raw).ok, false);
    assert.equal(session.read(), current);
}
(async () => {
    assert.equal((await importer.readFile({ name: "bank.json", size: 101 })).error.code, "size");
    assert.equal((await importer.readFile({ name: "bank.txt", size: 1 })).error.code, "extension");
    assert.equal((await importer.readFile({ name: "bank.json", size: 1, text: async () => "{}" })).value, "{}");
    session.clear();
    assert.equal(session.read().bank.length, 0);
    assert.equal(session.read().view, "import");
    console.log("PASS: DOM-free domain, immutable state, contracts, cancellation, retry, persistence, imports and matching");
})().catch(error => { console.error(error); process.exitCode = 1; });
