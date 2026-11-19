# JobConnect — Fixes (November 2026)

## Root cause of the US-03 / US-04 / US-05 test failures

The application code (backend AND frontend) was **correct**. The failures came
from **how the tests were executed**:

1. `node --test` runs multiple test files **in parallel** by default
   (concurrency = number of CPU cores − 1). On a multi-core Windows machine,
   `us01`, `us02`, `us03`… test files run **at the same time**.
2. All test files share **one** in-memory MongoDB, and every file does
   `User.deleteMany({})` in its `before`/`after` hooks. While one file was
   running its tests, another file's hook **wiped its users mid-run**.
   Result: random `401 !== 200/403/302` on perfectly valid logins and
   `404 "Utilisateur introuvable"` for perfectly valid tokens.

This was reproduced locally by forcing `--test-concurrency=5`: the exact same
failures appeared. With sequential execution: **100% pass**.

A second, rarer issue: sharing a single mongod across many connect/disconnect
cycles can degrade it (server-selection timeouts). Fixed by giving each test
file its own in-memory MongoDB.

## What changed

| File | Change |
| --- | --- |
| `run-backend-tests.js` | Runs test files **one after another**, each with its **own fresh in-memory MongoDB**, plus `--test-force-exit` (Node ≥ 22.5) so the child process always exits. Prints a per-run `RESULT` summary. |
| `*/backend/package.json` | `"test": "node --test --test-concurrency=1"` so `npm test` (used by CI or manually) is also race-safe. |
| `.gitignore` | Added — keeps `node_modules/`, build output and `.env` out of Git. |

No application code (models, routes, controllers, views, Angular) was modified.

## Verified results (in-memory MongoDB, Windows-independent)

| User story | Backend tests | Frontend tests |
| --- | --- | --- |
| US-01 register candidat | 7/7 pass | 6/6 pass |
| US-02 register entreprise | 15/15 pass | 13/13 pass |
| US-03 login | 25/25 pass | 19/19 pass |
| US-04 logout | 29/29 pass | 27/27 pass |
| US-05 role spaces | 43/43 pass | 29/29 pass |

## How to run

```bat
test-all-us.cmd
```

or, for a single user story:

```bat
cd us05-role-spaces\backend
node run-backend-tests.js
```
