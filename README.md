# CertPrep · QuizPractice

Local web app for practicing certification quizzes from a JSON question bank. It uses no backend, framework, external package, or remote service: open the files directly in a browser and progress is stored in `localStorage`.

The interface is available in English, Spanish, and French. On first launch it uses the browser's preferred language when supported; the language dropdown lets you override that choice and remembers it locally. Only the app interface is translated. Question text, answers, explanations, categories, and scenario content remain exactly as provided by the user's JSON bank.

For maintainers or a new developer taking over the project, see [`HANDOVER.md`](HANDOVER.md).

## Run the app

1. Open the `certification-preparation-app` folder.
2. Double-click `index.html`, or open it with a modern browser.
3. Click **Use demo** for an instant walkthrough, or choose `examples/sample-questions.json`.

No server or dependency installation is required. You may also serve the folder with any static file server during development, but it is optional.

## Workflow

1. Choose a `.json` file, drag it into the upload area, or paste JSON into the text box.
2. Click **Validate and load questions**. The app checks the structure and references between answers and options.
3. Review the summary by type and category.
4. Configure the question count, order, category, explanations, and mode:
   - **Practice:** check each question individually.
   - **Exam:** hide corrections and explanations until the session ends.
5. Answer, navigate freely, and click **Check all** or **Finish exam**.
6. Review the result and click **Retry missed** when needed.

Left/right arrow keys navigate between questions when focus is not in a form field. **Clear session** removes the bank and all progress stored in that browser.

## Structure

```text
certification-preparation-app/
├── index.html                     # Semantic interface structure
├── styles.css                     # Light/dark theme and responsive layout
├── app.js                         # Validation, state, rendering, and grading
├── locales/
│   ├── en.js                       # English interface strings
│   ├── es.js                       # Spanish interface strings
│   └── fr.js                       # French interface strings
├── README.md
├── HANDOVER.md                   # Development and maintenance handover guide
├── .nojekyll
├── schema/
│   └── questions.schema.json      # JSON Schema Draft 2020-12
└── examples/
    └── sample-questions.json      # Examples of all six types
```

## JSON format

The root is an object containing the required `questions` array. `version` and `title` are optional metadata.

```json
{
  "version": "1.0",
  "title": "My certification bank",
  "questions": [
    {
      "id": "q-001",
      "type": "multiple-choice",
      "category": "Fundamentals",
      "question": "Question text",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" }
      ],
      "correctAnswers": ["a"],
      "explanation": "Why this answer is correct.",
      "source": "Optional reference"
    }
  ]
}
```

### Common fields

| Field | Required | Description |
| --- | --- | --- |
| `id` | Yes | Unique question identifier. |
| `type` | Yes | One of the six supported types. |
| `question` | Yes | Prompt. In `fill-blank`, it contains blank markers. |
| `category` | No | Used for summaries and filtering. Missing categories appear as the localized equivalent of `Uncategorized`. |
| `description` | No | Additional instruction or context. |
| `explanation` | No | Explanation shown during grading or review. |
| `source` | No | Source reference. It is never interpreted as HTML. |

Identifiers are case-sensitive. Option and item ids only need to be unique within their own question.

## Question types

### 1. Single choice: `multiple-choice`

Requires `options` and one id in `correctAnswers`.

```json
{
  "id": "mc-1",
  "type": "multiple-choice",
  "question": "Which answer is correct?",
  "options": [
    { "id": "a", "text": "First" },
    { "id": "b", "text": "Second" }
  ],
  "correctAnswers": ["b"]
}
```

### 2. Multiple response: `multiple-response`

The answer is correct only when it exactly matches the full `correctAnswers` set.

```json
{
  "id": "mr-1",
  "type": "multiple-response",
  "question": "Select the two correct answers.",
  "options": [
    { "id": "a", "text": "First" },
    { "id": "b", "text": "Second" },
    { "id": "c", "text": "Third" }
  ],
  "correctAnswers": ["a", "c"]
}
```

### 3. True/False: `true-false`

Must include exactly two options with ids `true` and `false`.

```json
{
  "id": "tf-1",
  "type": "true-false",
  "question": "The statement is correct.",
  "options": [
    { "id": "true", "text": "True" },
    { "id": "false", "text": "False" }
  ],
  "correctAnswers": ["true"]
}
```

### 4. Scenario: `scenario`

Add `scenario` to the single-choice format. Multiple questions can share an optional `scenarioId` when they belong to the same context.

```json
{
  "id": "sc-1",
  "type": "scenario",
  "scenarioId": "store-case",
  "scenario": "An online store receives unpredictable traffic.",
  "question": "Which approach should you apply?",
  "options": [
    { "id": "a", "text": "Autoscaling" },
    { "id": "b", "text": "Fixed capacity" }
  ],
  "correctAnswers": ["a"]
}
```

### 5. Matching: `matching`

`correctMatches` uses each `leftItems` id as a key and the correct `rightItems` id as its value. In the interface, select an item on the left and then its match on the right; SVG connections are redrawn when the viewport changes.

```json
{
  "id": "match-1",
  "type": "matching",
  "question": "Match each concept.",
  "leftItems": [
    { "id": "l1", "text": "Concept one" },
    { "id": "l2", "text": "Concept two" }
  ],
  "rightItems": [
    { "id": "r1", "text": "Definition one" },
    { "id": "r2", "text": "Definition two" }
  ],
  "correctMatches": {
    "l1": "r2",
    "l2": "r1"
  }
}
```

### 6. Fill in the blanks: `fill-blank`

Every `{{id}}` marker in the prompt must have a matching entry in `blanks`. `correctAnswer` must exactly match one of its options.

```json
{
  "id": "fill-1",
  "type": "fill-blank",
  "question": "{{concept}} adjusts capacity to demand.",
  "blanks": [
    {
      "id": "concept",
      "options": ["Elasticity", "Latency"],
      "correctAnswer": "Elasticity"
    }
  ]
}
```

[`examples/sample-questions.json`](examples/sample-questions.json) contains a ready-to-use bank with all six types, including two questions that share a scenario.

## Validation

Before loading, the app checks:

- Valid JSON syntax and the presence of `questions`.
- Known types and required fields for each type.
- Duplicate question, option, item, and blank ids.
- Correct answers that exist among the available options.
- Matching pairs that reference both sides.
- Coherent markers and options in `fill-blank`.

`schema/questions.schema.json` can validate a bank with any JSON Schema Draft 2020-12 tool. Relational rules — such as verifying that a `correctAnswers` value exists in `options` — are checked by JavaScript because JSON Schema does not express them conveniently.

## Persistence and privacy

The app stores the following in one `localStorage` entry:

- Imported bank.
- Session configuration.
- Selected questions and their order.
- Answers and grading results.
- Current position and final result.

The selected interface language is stored separately under `certprep.locale.v1`, so changing language never changes the imported questions or quiz progress.
- Theme preference.

Data stays on the device. Imported text is inserted through `textContent` or text nodes, never evaluated or interpreted as HTML.

## Current limitations

- Runtime validation does not load an external JSON Schema library; it applies an equivalent functional validation for the rules the app uses.
- Data depends on the browser's local storage. Private browsing, clearing site data, or storage limits can remove it.
- `matching` is designed for one-to-one relationships; reusing a right-side item replaces its previous connection.
- There are no PDF, Word, CSV, or free-text importers.
- There is no cross-device sync, account system, multi-attempt history, or accumulated analytics.

## Recommended future improvements

1. Add a visual bank editor with JSON export.
2. Add historical category statistics and spaced repetition.
3. Support scenario groups that share context without repeating it in every question.
4. Add optional CSV and learning-platform importers.
5. Add automated regression tests and schema checks in GitHub Actions.
