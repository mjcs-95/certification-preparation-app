# Handover guide · CertPrep

This document enables another person to continue developing CertPrep without needing context from previous conversations.

## 1. Project purpose

CertPrep is a static web application for practising certification questions from JSON banks supplied by the user.

Current features:

- No backend, framework, dependencies, or build process.
- Runs directly from `index.html` or through a static web server.
- Six question types: single choice, multiple response, true/false, scenario, matching, and fill in the blanks.
- Practice and exam modes.
- Responsive question map: scrollable on desktop and collapsible/grid-based on narrow screens.
- Progress, answers, configuration, and theme stored in `localStorage`.
- Interface available in English, Spanish, and French.
- Question content is not translated: it is displayed exactly in the language of the loaded JSON.

## 2. How to run and verify the project

### Quick start

1. Open the `certification-preparation-app` folder.
2. Open `index.html` directly in a browser, or serve the folder with a static web server.
3. Click **Use demo** to load the example bank.

For example, with Python:

```powershell
python -m http.server 4174
```

Then open `http://127.0.0.1:4174/`.

### Minimum checks before delivering changes

```powershell
node --check js/app.js
node --check locales/en.js
node --check locales/es.js
node --check locales/fr.js
```

Also check manually:

1. Demo bank loading.
2. Invalid JSON and valid JSON validation.
3. All six question types.
4. Practice and exam modes.
5. Language changes in the import, setup, quiz, and results views.
6. Reloading the page to confirm that language and progress are retained.
7. Light/dark theme, keyboard navigation, and mobile layout.
8. Question, answer, and explanation text remains unchanged when the interface language changes.

Run `node tests/regression.cjs` and `node tests/domain.cjs` for dependency-free development checks. See `tests/README.md` for coverage and limitations.

## 3. Code map

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic interface structure, views, and controls. |
| `styles.css` | Light/dark theme, responsive layout, visual states, and visual accessibility. |
| `js/app.js` | Composition root: constructs modules, injects dependencies and starts the app. |
| `js/i18n.js` | Locale detection, translation lookup, and language preference storage. |
| `js/demo-bank.js` | Built-in demonstration question bank. |
| `js/importer.js` | JSON parsing and file-reading helpers. |
| `js/question-map.js` | Question-map rendering and navigation states. |
| `js/setup.js` | Initial bank summary and quiz setup view. |
| `js/state.js` | Default session-state factory. |
| `js/storage.js` | Safe `localStorage` adapter. |
| `js/evaluation.js` | Pure answer evaluation and answered-state helpers. |
| `js/randomization.js` | Pure shuffle, set, and randomized-order helpers. |
| `js/validation.js` | Question-bank validation helpers, created with a translation function. |
| `locales/en.js` | English interface strings and primary fallback. |
| `locales/es.js` | Spanish interface strings. |
| `locales/fr.js` | French interface strings. |
| `schema/questions.schema.json` | JSON Schema Draft 2020-12 schema. |
| `examples/sample-questions.json` | Example bank containing all six formats. |
| `README.md` | Usage guide and JSON format reference. |
| `CONTRIBUTING.md` / `CLA.md` | Contribution rules and agreement. |

## 4. `js/app.js` architecture

The application uses classic local scripts; modules publish factories under `window.CertPrep`.
Only `app.js` resolves those factories and connects them. See `ARCHITECTURE.md` for the full dependency map and contracts.

- `session-manager.js` owns the current immutable snapshot and persistence.
- `quiz-domain.js` computes state transitions without DOM or browser effects.
- `quiz-controller.js` coordinates commands, confirmation and effect execution.
- `app-effects.js` applies persistence, rendering, navigation and notifications.
- `form-adapter.js` reads and writes form controls; `app-actions.js` adapts UI events.
- `question-types.js` supplies a common evaluation protocol.
- Option, fill and matching renderers display snapshots and dispatch answer commands.
- `matching-domain.js`, `matching-controller.js` and `matching-renderer.js` isolate matching rules, transient selection and SVG presentation.
- Views do not mutate session snapshots; they read the latest snapshot on each render.

Persisted state uses the key `certprep.quiz-session.v1`. It includes the generated `matchingOrders` for the current session, so a matching question keeps its order while the user navigates. A new session generates fresh orders and deliberately avoids repeating the previous order when there are at least two items. The language is stored separately with `certprep.locale.v1`; keeping them separate prevents a language change from modifying progress.

## 5. Important rules for continuing development

### JSON question banks

- Identifiers and question types are part of the format contract.
- References between `options`, `correctAnswers`, `leftItems`, `rightItems`, `correctMatches`, and `blanks` are validated in JavaScript.
- Matching question items are shuffled per session, but their original ids remain unchanged so `correctMatches` and saved responses continue to work.
- User content must be treated as text. Keep using `textContent` and avoid `innerHTML` when rendering questions, explanations, categories, or sources.
- Do not automatically translate bank fields: only application-owned interface strings should be translated.

### Localization

- Static strings use `data-i18n`, `data-i18n-aria-label`, `data-i18n-title`, or `data-i18n-placeholder` attributes.
- Strings created by JavaScript must go through `t("key", variables)`.
- When adding a string, add it to all three files in `locales/`; `en.js` acts as the fallback.
- Language files are loaded as scripts rather than through `fetch`, preserving compatibility with direct `file://` use.
- Regional codes are normalized (`en-GB` → `en`). Priority is: saved selection, browser preferences, and English as the final fallback.

### HTML and accessibility

- Preserve the existing headings and `aria-labelledby` relationships.
- Buttons with icons must retain accessible text and their `aria-label` attributes.
- Do not remove the skip link, visible focus styles, or keyboard states.

### CSS

- Rules inside `@media` deliberately override the desktop layout; check desktop, tablet, and mobile after grouping selectors.
- Keep the `:root` and `html[data-theme="dark"]` variables as the single source of truth for colors and dimensions.
- Minification can be applied to a release artifact, but it does not replace visual review.

## 6. Application data flow

1. DOM events are translated into data by `app-actions.js` and `form-adapter.js`.
2. Import parsing and validation return a result before a bank can be committed.
3. `quiz-controller.js` passes commands and the session snapshot to the domain.
4. Successful transitions replace the session snapshot.
5. `app-effects.js` renders, persists once and performs requested navigation or notifications.
6. Renderers dispatch response commands through injected callbacks.

If the persisted state shape changes, preserve compatibility with older sessions or explicitly increment the storage key version.

## 7. Publishing with GitHub Pages

The project does not require a build step. To publish it:

1. Upload the contents of this folder to a repository.
2. In GitHub, open **Settings → Pages**.
3. Select **Deploy from a branch**, then choose the desired branch and the root `/` folder.
4. Verify that `index.html`, `js/app.js`, `styles.css`, and `locales/` are in the published root.

`.nojekyll` is already included. Do not move `locales/` or change relative paths unless the `script` elements in `index.html` are updated as well.

## 8. Suggested future improvements

These tasks are not implemented and require a decision before being started:

- Extend browser-level coverage for keyboard focus and SVG geometry.
- Add a minification tool for the publication artifact only.
- Improve pluralization with `Intl.PluralRules` if more languages are added.
- Add a migration strategy if the `localStorage` format changes.
- Decide whether analytics or telemetry are wanted; the application currently sends no data to any server.

## 9. Delivery checklist

- [ ] The change is limited to the requested objective.
- [ ] The import and quiz flow has been tested.
- [ ] All three interface languages have been checked.
- [ ] User JSON content has not been translated or altered.
- [ ] `node --check` reports no errors.
- [ ] Responsive layouts have been reviewed.
- [ ] `README.md` and this document are updated if the architecture changes.
- [ ] `CONTRIBUTING.md`, `CLA.md`, and the license have been reviewed before accepting external contributions.
