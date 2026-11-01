# Python Steps

A phone-first, hand-held Python practice app that teaches Python through the work of an AI builder. Each day is a chapter of a story: you join a small team at a district health office building **Stockwise**, an AI assistant that helps pharmacists avoid stockouts, guided by Zara, the team's lead engineer. It is published as a private Claude artifact: `[Python Steps artifact link]`.

## Week 1: The Stockwise story

| Chapter | Title | Python skill | AI-builder skill |
|---|---|---|---|
| 1 | Day one at the lab | print() | Read what a model returns before trusting it |
| 2 | The assistant's memory | Variables | System prompt, model name, temperature |
| 3 | The token budget | Numbers and maths | Tokens, context window, cost estimates |
| 4 | Messy messages | Working with text | Cleaning input, length checks, a first guardrail with `in` |
| 5 | Writing the prompt | f-strings | Prompt templates, multi-line prompts |
| 6 | The night the bot broke | Reading errors | Debugging a broken assistant |
| 7 | Launch day | Putting it together | Inputs, maths in code, then a prompt built from the results |

Each chapter has a story page (scene, a quote from Zara, a "Builder's notebook" note on why it matters for AI, and a bridge from Power Automate or Copilot Studio), 7 or 8 small steps with Zara's lines, and a closing scene. Stockwise gains a new ability with each chapter.

All people, places and numbers are made up. No real or work data.

## Features

- **MiniPy** (`src/minipy.js`): a small, safe Python interpreter that runs in the page. No eval, no network calls, nothing to install. Its error messages follow CPython 3.13 wording.
- **Step types**: watch it run, change it, quick check, fill the blank, fix the bug, write it, meet an error. Two hints per step, Show answer, and plain-language error help.
- **Ask Zara**: a chat where you can ask any simple question, from the home screen, from any step, or from the chat button in the header. It knows which step you're on and sees your code. Zara is Claude playing the mentor, running on the viewer's own Claude account. Outside Claude (for example in the offline copy) the chat explains that it needs the Claude link.
- **Progress**: streaks, XP, levels and badges, saved privately per person in the artifact store, with a copy on the device as a fallback.

## Build and test

```bash
node python-steps/build.mjs                 # writes python-steps/index.html (the published page)
node python-steps/tests/test-minipy.mjs     # 126 snippets: MiniPy vs real python3 (output, error type, message, line)
node python-steps/tests/test-lessons.mjs    # every step vs real python3 and the app's checker
```

The tests need `python3` (3.13 was used) on the PATH.

## Adding a week

Add chapter objects to `LESSONS` in `src/lessons.js` (story fields: `scene`, `quote`, `why`, `bridge`, `outro`, `ability`; each step can have a `say` line for Zara). Then run both test files, rebuild, and republish the same artifact so the link stays the same.
