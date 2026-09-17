# LDC 32101 — Organisation and Managerial Communication

Practice quiz built from the LDC 32101 lecture slides, in the same style and system as the
CHEM 31201 organic chemistry quiz. 173 questions across 11 modules, each with a full
explanation of the correct answer.

## Structure

```
index.html                 hub — lists all modules, shows your best score per module
technical-writing.html     one page per module (11 in total)
proposal-writing.html
business-writing.html
meetings.html
press-release.html
organisational-communication.html
interpersonal-communication.html
listening.html
lobbying-negotiation.html
problem-solving.html
interviews.html

assets/style.css           the shared theme (edit once, every page changes)
assets/quiz.js             the shared engine — registration, shuffling, scoring,
                           explanations, class notes, results, leaderboard
data/<module>.js           the question bank for that module — the only file
                           you edit when adding or fixing questions
```

Each module page is about 15 lines: it sets `QUIZ_META`, loads its own question bank,
then loads the engine. Nothing else.

## Modules

| # | Module | Questions |
|---|---|---|
| 1 | Technical Writing | 12 |
| 2 | Proposal Writing | 17 |
| 3 | Business Writing (letters, memos, CVs) | 17 |
| 4 | Meetings, Agenda & Minutes | 18 |
| 5 | Press Release | 10 |
| 6 | Organisational Communication | 19 |
| 7 | Interpersonal Communication | 15 |
| 8 | Effective Listening | 14 |
| 9 | Lobbying & Negotiation | 20 |
| 10 | Problem Solving | 12 |
| 11 | Interviewing Techniques | 19 |

## Adding a question

Open `data/<module>.js` and add one object to the array:

```js
{
  s: "Sub-topic",                  // becomes a filter pill on the module's home screen
  q: "The question text",          // HTML allowed, e.g. <em>…</em>
  opts: ["A", "B", "C", "D"],
  ans: 1,                          // index of the correct option (0 = first)
  exp: "Why that answer is correct."
}
```

Options are shuffled at runtime, so `ans` always refers to the order written in the file.

## Adding a whole module

1. Create `data/new-topic.js` with a `window.QUESTIONS = [...]` array.
2. Copy any module page, change the `QUIZ_META` block and the `data/…` script path.
3. Add a card for it in `index.html` (`module-grid`) and an entry in the `MODULES` array
   at the bottom of the same file.

## Hosting

Push the folder to a repo and enable GitHub Pages (Settings → Pages → branch `main`,
folder `/root`). `index.html` is the entry point.

Scores and class notes are saved in each student's own browser via `localStorage`,
so every device keeps its own leaderboard.
