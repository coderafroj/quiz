# Contributing to Codarafroj Play

Thanks for helping! The easiest and most valuable contribution is **adding or fixing quiz questions**. Code contributions are welcome too.

## Ways to contribute

| You want to... | Start here |
| --- | --- |
| Add or fix O Level questions | [Adding questions](#adding-o-level-questions) |
| Fix a bug | Issues labeled `bug` |
| Build a feature | Open an issue first so we can agree on the approach |
| Improve docs | Edit any `.md` file and open a PR |

Look for issues labeled **`good first issue`** if you are new.

## Local setup

```bash
git clone https://github.com/coderafroj/quiz.git
cd quiz
npm install
cp .env.example .env.local   # then fill in your own Firebase values
npm run dev
```

You need your own free Firebase project (Authentication + Firestore). See the README for the steps. **Never use or commit someone else's keys.**

Before opening a PR, run:

```bash
npm run lint
npx tsc --noEmit
```

## Adding O Level questions

Questions live in `lib/olevel/m1.ts` to `m4.ts` (one file per paper), grouped by unit. Each question is a compact tuple:

```ts
[question, "optionA|optionB|optionC|optionD", correctIndex, level]
```

- `correctIndex` is 0-based (0 = first option).
- `level` is `"e"` (easy), `"m"` (medium) or `"h"` (hard).
- Exactly 4 options, separated by `|`. Do not use `|` inside an option.

Example:

```ts
["Which keyword defines a function in Python?", "func|def|function|lambda", 1, "e"],
```

Rules for questions:

1. Write them **yourself**. Do not copy from books, paid test series or other websites (copyright).
2. Only one option may be correct, and you must be sure it is correct.
3. Stay within the NIELIT O Level syllabus for that unit.
4. No duplicates. Search the file for similar wording first.

## Pull request checklist

- [ ] One focused change per PR
- [ ] `npm run lint` and `npx tsc --noEmit` pass
- [ ] No secrets, `.env` files or personal data included
- [ ] Screenshots attached if the UI changed

## Security issues

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Code of Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
