# Application architecture

The application still runs by opening `index.html`. Every script is local and
classic (`defer`); no module imports, server, build step or runtime packages are required.

## Ownership and dependency direction

| Layer | Files | Contract |
| --- | --- | --- |
| Composition | `js/app.js` | Constructs services, binds browser capabilities, wires ports and starts the app. |
| UI events/forms | `app-actions.js`, `event-bindings.js`, `form-adapter.js` | Converts browser events and controls into command data. |
| Application control | `quiz-controller.js`, `import-controller.js` | Coordinates injected services; never accesses the DOM. |
| Quiz domain | `quiz-domain.js`, `quiz-selection.js`, `quiz-progress.js`, `question-types.js`, `evaluation.js` | Computes transitions, selection, progress and grading from plain data. |
| Session | `session-manager.js`, `state.js` | One immutable current snapshot, defaults, restore, reset and persistence. |
| Effects | `app-effects.js`, injected platform capabilities, `storage.js` | Executes persistence, view changes, scroll, confirmation, timers and notifications. |
| Presentation | `quiz-view.js`, setup/results/map/question renderers | Reads snapshots and updates DOM; never mutates or persists quiz state. |
| Matching | `matching-domain.js`, `matching-controller.js`, `matching-renderer.js` | Pure one-to-one pairing, transient active item, and DOM/SVG respectively. |
| Localization | `i18n.js`, `i18n-ui.js` | Injected dictionaries, browser preferences and storage; DOM translation adapter. |

All filenames without a directory in this table live in `js/`.
Modules publish their own API under `window.CertPrep`, but do not look up siblings.
Factories receive the capabilities they consume. The root's late-bound render/reset
callbacks resolve UI feedback loops; they do not introduce module imports or
global service lookup.

## State and command contract

`session.read()` returns a deeply frozen snapshot. Views must call it on each
render instead of retaining a state object across transitions. Transient matching
selection, locale and map expansion are kept outside quiz responses.

`domain.execute(snapshot, command, payload)` does not mutate its input. It returns:

- Success: `{ ok: true, value: nextState, error: null, effects }`.
- Failure: `{ ok: false, value: null, error: { code, variables? }, effects: {} }`.

Commands cover start, navigation, answers, checking, finish, reset, retry, bank
replacement, view selection and theme. The controller commits successful results
and sends their effect descriptions to the effect service. Cancellation and
rejected commands do not commit or persist anything.

Import, validation and session operations use the same `ok/value/error` envelope.
Errors may additionally contain translated `messages`, a `footer`, or a `cause`.
Queries and pure calculations return data directly; render and event-binding
methods return nothing. Storage is a low-level adapter returning booleans, which
the session service converts to the application result contract.

Bank data and unchanged nested values are shared between immutable snapshots.
Only changed state containers are copied, avoiding a full bank serialization on
each domain transition. Persistence serializes the snapshot once per committed
action. Rendering and locale changes do not persist the quiz.

## Question protocols

Domain handlers in `question-types.js` implement:

- `isAnswered(question, response): boolean`
- `evaluate(question, response): boolean`

The evaluation service receives the handler registry. Evaluation is gated by
`isAnswered`, so incomplete answers cannot grade as correct.

Presentation handlers implement `render(question, evaluation): void`.
The root constructs option, fill and matching handlers, then supplies the registry
to the question renderer. Single-choice, scenario, multiple-response and
true/false share the option renderer. Feedback and controls remain in the
question renderer. Adding a type also requires updating bank validation,
response formatting, translations and schema where its format needs them.

Answer callbacks send plain `{ id, response }` commands. The domain rejects
answers for a non-current or already checked question. Matching requests a full
quiz render; option/fill changes update progress without replacing the focused
input.

## Matching

Pairing and removal produce a new response object. Connecting a right item
removes its previous connection, preserving the existing one-to-one rule.
The matching controller owns the active left item and resets it on navigation,
start, retry, reset and bank replacement. The matching renderer owns buttons,
connection chips and SVG paths, including evaluation colors and resize drawing.

Matching order generation retains the existing shuffle algorithm and saved
orders. A new session avoids repeating a previous order when at least two items
exist; navigating within a session retains its order.

## Verification

Run `node tests/domain.cjs` and `node tests/regression.cjs`. Node is optional
development tooling only. The first suite runs without a DOM; the second loads
scripts in HTML order and exercises UI callbacks in a simulated DOM.
Real-browser focus, responsive layout and SVG geometry require manual checks.
