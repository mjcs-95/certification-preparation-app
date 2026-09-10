/* SPDX-License-Identifier: AGPL-3.0-only */
// Optional development checks: node tests/regression.cjs (no dependencies).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const key = 'certprep.quiz-session.v1';

class Element {
    constructor(id = '') {
        Object.assign(this, { id, dataset: {}, children: [], listeners: {}, value: '', tagName: 'DIV' });
        this.style = { setProperty() {} };
        const classes = new Set();
        this.classList = { add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)), contains: name => classes.has(name) };
    }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    add(node) { this.append(node); }
    setAttribute() {}
    focus() {}
    scrollIntoView() {}
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    querySelector() { return null; }
    querySelectorAll(selector) {
        const descendants = this.children.flatMap(node => node instanceof Element ? [node, ...node.querySelectorAll('*')] : []);
        return selector === 'input:checked' ? descendants.filter(node => node.checked) : selector === '*' ? descendants : [];
    }
}

function boot(initial) {
    const nodes = new Map(), storage = new Map();
    if (initial) storage.set(key, JSON.stringify(initial));
    let writes = 0;
    const get = (selector) => {
        if (!nodes.has(selector)) nodes.set(selector, new Element(selector.slice(1)));
        return nodes.get(selector);
    };
    const views = ['import', 'setup', 'quiz', 'results'].map(name => get('#' + name + '-view'));
    const document = {
        documentElement: new Element(), activeElement: new Element(), querySelector: get,
        querySelectorAll: selector => selector === '.view' ? views : [],
        createElement: () => new Element(), createTextNode: text => ({ textContent: text }),
        createElementNS: () => new Element(), addEventListener() {},
    };
    const context = {
        document, console, navigator: { language: 'en', languages: ['en'] },
        Option: class extends Element { constructor(text, value) { super(); this.textContent = text; this.value = value; } },
        localStorage: {
            getItem: k => storage.get(k) ?? null,
            setItem: (k, v) => { storage.set(k, v); if (k === key) writes++; },
            removeItem: k => storage.delete(k),
        },
        matchMedia: () => ({ matches: false }), setTimeout: () => 1, clearTimeout() {},
        requestAnimationFrame() {}, scrollTo() {}, addEventListener() {}, confirm: () => true,
    };
    context.window = context;
    vm.createContext(context);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const [, src] of html.matchAll(/<script[^>]*src="([^"]+)"/g)) {
        assert(!src.startsWith('http'), 'Runtime scripts must be local');
        vm.runInContext(fs.readFileSync(path.join(root, src.split('?')[0]), 'utf8'), context, { filename: src });
    }
    return {
        context, get, writes: () => writes,
        state: () => JSON.parse(storage.get(key)),
        fire(selector, type = 'click') {
            for (const fn of get(selector).listeners[type] ?? []) fn({ preventDefault() {} });
        },
    };
}

let app = boot();
app.fire('#load-demo');
app.fire('#validate-load');
const bank = app.state().bank;
assert(bank.length > 0);
app.get("input[name='selection']:checked").value = 'ordered';
app.get("input[name='mode']:checked").value = 'practice';
app.get('#question-count').value = String(bank.length);
app.fire('#quiz-config', 'submit');
assert.equal(app.state().view, 'quiz');
let before = app.writes();
app.fire('#next-question');
assert.equal(app.state().currentIndex, 1);
assert.equal(app.writes() - before, 1, 'Navigation persists exactly once');
before = app.writes();
app.get('#language-select').value = 'es';
app.fire('#language-select', 'change');
assert.equal(app.writes(), before, 'Translation rendering does not save the quiz');

const snapshot = app.state();
for (const q of snapshot.bank) {
    snapshot.responses[q.id] = q.type === 'matching' ? q.correctMatches
        : q.type === 'fill-blank' ? Object.fromEntries(q.blanks.map(b => [b.id, b.correctAnswer]))
        : q.type === 'multiple-response' ? q.correctAnswers : q.correctAnswers[0];
}
app = boot(snapshot);
assert.equal(app.state().currentIndex, 1, 'Restore preserves navigation');
const elements = app.context.CertPrep.domElements.create(app.context.document);
for (const fn of elements.finish.listeners.click ?? []) fn({ preventDefault() {} });
assert.equal(app.state().view, 'results');
assert(Object.values(app.state().evaluations).every(e => e.correct), 'All question types grade correctly');

app.fire('#clear-session');
assert.equal(app.state().view, 'import');
assert.equal(app.state().bank.length, 0);
app.fire('#load-demo'); app.fire('#validate-load');
assert.equal(app.get('#total-questions').textContent, String(bank.length), 'Setup sees the replacement bank');
const replacement = { questions: [bank[0]] };
app.get('#json-input').value = JSON.stringify(replacement);
app.fire('#validate-load');
assert.equal(app.state().bank.length, 1);
assert.equal(app.get('#total-questions').textContent, '1');
app.get('#json-input').value = '{invalid'; app.fire('#validate-load');
assert.equal(app.state().bank.length, 1, 'Invalid input preserves the active bank');
const randomization = app.context.CertPrep.randomization;
const items = [{ id: 'a' }, { id: 'b' }];
const previous = randomization.shuffledIds(items);
assert.notEqual(JSON.stringify(randomization.shuffledIds(items, previous)), JSON.stringify(previous));
console.log('PASS: startup, selection, navigation, render/persistence separation, grading, restore, clear, bank replacement and matching order');

// Exercise real renderer callbacks, not just pre-populated saved responses.
function descendants(element) { return element.querySelectorAll('*'); }
function emit(element, type) { for (const fn of element.listeners[type] ?? []) fn({ preventDefault() {} }); }
for (const q of bank) {
    const initial = { ...snapshot, bank: [q], quizIds: [q.id], currentIndex: 0,
        responses: {}, evaluations: {}, completed: false, view: 'quiz' };
    const instance = boot(initial);
    const content = instance.context.CertPrep.domElements.create(instance.context.document).questionContent;
    if (q.type === 'matching') {
        for (const [leftId, rightId] of Object.entries(q.correctMatches)) {
            emit(descendants(content).find(node => node.dataset.side === 'left' && node.dataset.itemId === leftId), 'click');
            emit(descendants(content).find(node => node.dataset.side === 'right' && node.dataset.itemId === rightId), 'click');
        }
    } else if (q.type === 'fill-blank') {
        const controls = descendants(content).filter(node => node.className === 'blank-select');
        for (let index = 0; index < controls.length; index++) {
            controls[index].value = q.blanks[index].correctAnswer;
            emit(controls[index], 'change');
        }
    } else {
        for (const id of q.correctAnswers) {
            const control = descendants(content).find(node => node.value === id && ['radio', 'checkbox'].includes(node.type));
            control.checked = true;
            emit(control, 'change');
        }
    }
    instance.fire('#check-question');
    assert.equal(instance.state().evaluations[q.id]?.correct, true, 'Renderer events answer ' + q.type);
}
for (const q of bank.filter(q => ['true-false', 'scenario', 'multiple-choice'].includes(q.type))) {
    const wrong = q.options.find(option => !q.correctAnswers.includes(option.id));
    const instance = boot({ ...snapshot, bank: [q], quizIds: [q.id], currentIndex: 0, view: 'quiz',
        responses: { [q.id]: wrong.id }, evaluations: {} });
    instance.fire('#check-question');
    const content = instance.context.CertPrep.domElements.create(instance.context.document).questionContent;
    assert(descendants(content).some(node => node.classList.contains('incorrect-answer')), 'Wrong choice is red');
    assert(descendants(content).some(node => node.classList.contains('correct-answer')), 'Correct choice is green');
}
console.log('PASS: real answer callbacks for all types and wrong/correct option styles');
