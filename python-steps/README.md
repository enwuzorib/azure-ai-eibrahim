# Python Steps

A phone-first, hand-held Python practice app. One short lesson a day (10 to 15 minutes), small steps, free hints, and every idea linked back to Power Automate. It is published as a private Claude artifact: `[Python Steps artifact link]`.

## What is in Week 1: Talking to Python

| Day | Lesson | You can do this afterwards |
|---|---|---|
| 1 | Say hello with print() | Show text, read your first errors |
| 2 | Variables | Store and reuse values |
| 3 | Numbers and maths | Calculate balances and months of stock, round results |
| 4 | Working with text | Join, clean and change text |
| 5 | Mixing text and numbers | Build messages with str() and f-strings |
| 6 | Reading errors without fear | Read the error type, line and message, fix bugs one at a time |
| 7 | Mini project: a stock card | A small working program: inputs, calculations, report |

All examples use made-up facilities and numbers. No real or work data.

## How it works

- **MiniPy** (`src/minipy.js`) is a small, safe Python interpreter that runs in the page. It has no eval, makes no network calls and needs no installs, so it works on a phone. It covers the beginner subset of Python the lessons use, and its error messages follow CPython 3.13 wording.
- **Lessons** (`src/lessons.js`) hold each step: the type (run, change, quiz, fill the blank, fix the bug, write it, meet an error), the starting code, the check, two hints, the answer and the explanation.
- **App** (`src/app.js`, `src/styles.css`) handles the home path, streaks, XP, badges, the code editor with a symbol row, and the optional "Ask Claude" helper. Ask Claude runs on the viewer's own Claude account and sends only the current step and code.
- **Progress** is saved privately per person in the artifact's store, with a copy on the device as a fallback.

## Build and test

```bash
node python-steps/build.mjs                 # writes python-steps/index.html (the published page)
node python-steps/tests/test-minipy.mjs     # 126 snippets: MiniPy vs real python3 (output, error type, message, line)
node python-steps/tests/test-lessons.mjs    # every step vs real python3 and the app's checker
```

The tests need `python3` (3.13 was used) on the PATH.

## Adding a week

Add lesson objects to `LESSONS` in `src/lessons.js`, run both test files, rebuild, and republish the same artifact so the link stays the same.
