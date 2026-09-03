# Handover guide · CertPrep

This document enables another person to continue developing CertPrep without needing context from previous conversations.

## 1. Project purpose

CertPrep is a static web application for practising certification questions from JSON banks supplied by the user.

Current features:

- No backend, framework, dependencies, or build process.
- Runs directly from `index.html` or through a static web server.
- Six question types: single choice, multiple response, true/false, scenario, matching, and fill in the blanks.
- Practice and exam modes.
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
node --check app.js
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

There is currently no automated test suite; the reference functional test is the complete flow using `examples/sample-questions.json`.

## 3. Code map

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic interface structure, views, and controls. |
| `styles.css` | Light/dark theme, responsive layout, visual states, and visual accessibility. |
| `app.js` | State, persistence, validation, rendering, navigation, and grading. |
| `locales/en.js` | English interface strings and primary fallback. |
| `locales/es.js` | Spanish interface strings. |
| `locales/fr.js` | French interface strings. |
| `schema/questions.schema.json` | JSON Schema Draft 2020-12 schema. |
| `examples/sample-questions.json` | Example bank containing all six formats. |
| `README.md` | Usage guide and JSON format reference. |
| `CONTRIBUTING.md` / `CLA.md` | Contribution rules and agreement. |

## 4. `app.js` architecture

The file is wrapped in an IIFE and exposes no public API. Its main areas are:

- **Localization:** `detectInitialLocale`, `t`, `applyLocale`, and `setLocale`.
- **Persistence:** `loadSavedState`, `saveState`, and `clearSavedSession`.
- **Import and validation:** `parseAndLoadInput`, `validateQuestionBank`, and type-specific validators.
- **Configuration:** `renderSetup` and `startQuiz`.
- **Quiz:** `renderQuiz`, `renderQuestion`, option/matching/fill-in-the-blank renderers, and navigation.
- **Evaluation:** `evaluateQuestion`, `isAnswered`, `renderFeedback`, and `renderResults`.
- **General interface:** `showView`, `applyTheme`, messages, and toasts.

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

```text
User JSON
    ↓
parseAndLoadInput()
    ↓
validateQuestionBank()
    ↓
state.bank + state.config
    ↓
renderSetup() → startQuiz()
    ↓
state.quizIds + state.responses + state.evaluations
    ↓
renderQuiz() → finishQuiz()
    ↓
renderResults()
```

Every relevant change calls `saveState()`. If the state shape changes, preserve compatibility with older sessions or explicitly increment the storage key version.

## 7. Publishing with GitHub Pages

The project does not require a build step. To publish it:

1. Upload the contents of this folder to a repository.
2. In GitHub, open **Settings → Pages**.
3. Select **Deploy from a branch**, then choose the desired branch and the root `/` folder.
4. Verify that `index.html`, `app.js`, `styles.css`, and `locales/` are in the published root.

`.nojekyll` is already included. Do not move `locales/` or change relative paths unless the `script` elements in `index.html` are updated as well.

## 8. Suggested future improvements

These tasks are not implemented and require a decision before being started:

- Add automated tests for validation and grading.
- Extract the demo bank into a separate resource if reducing `app.js` size is important.
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
