# Regression checks

Run from the project root:

```sh
node tests/domain.cjs
node tests/regression.cjs
```

No packages are required. Node is optional development tooling; the app runs
by opening `index.html` directly.

- Domain checks run without DOM/browser services: immutable snapshots,
  rejected commands, checked-answer locking, cancellation, retry, session
  persistence/restoration, import validation/errors and matching reassignment.
- Integration checks load actual scripts in HTML order with a simulated DOM:
  startup, bank replacement, clear/restore, navigation persistence, translation,
  grading, randomized matching orders, answer callbacks for all six types,
  and red/green classes for incorrect/correct options.

These checks do not validate CSS appearance, keyboard focus or SVG geometry.
Check those in a real browser. Module contracts are documented in
`../ARCHITECTURE.md`.
