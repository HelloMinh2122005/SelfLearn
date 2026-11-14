# quiz-app

A small local quiz server for the SelfLearn workspace. Node.js + Express + SQLite, plain HTML/JS UI, no build step.

- The quiz tree mirrors the workspace: **topic** (`aws`, `azure`, `cloud_devops_basic`, ...) → **subtopic** folders (`network`, `2 Domain 2 - ...`, `2_1 Network Fundamentals and Models`) → **file** (`2_1_1 How Networks Transfer Data.md`).
- Each **file** holds multiple-choice questions with options **A, B, C, D**, one correct option, an explanation, and **0..n hints**.
- Question, options, hints and explanation all render **Markdown and Mermaid** (` ```mermaid ` fences).
- Answers are stored and scored. There is a dashboard, and answers can be reset per question, per file, or per folder/topic.
- Single local user, no login, binds to `127.0.0.1` only.

## Quick start

```bash
cd quiz-app
npm install
npm run sync      # import the workspace's lesson files into the quiz tree (safe to re-run)
npm start         # http://127.0.0.1:3000
```

| Command | What it does |
| :--- | :--- |
| `npm start` | Start the server. |
| `npm run dev` | Start with `node --watch` (restarts on change). |
| `npm run sync` | Add missing folders/files from the workspace. Additive and idempotent. |
| `npm run sync -- --dry-run` | Print what would be created, change nothing. |
| `npm run sync -- --prune` | Also delete nodes whose path no longer exists, **only if they hold no questions**. |
| `npm test` | Run the API tests (in-memory DB). |

Requires Node.js 22+ (required by better-sqlite3 13; developed on 22.22). Dependencies: `express` 5, `better-sqlite3` 13, and for the browser `marked`, `dompurify`, `mermaid` (served from `node_modules` under `/vendor/`, so it works offline).

## Configuration (environment variables)

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `PORT` | `3000` | HTTP port. |
| `HOST` | `127.0.0.1` | Bind address. Keep it local: there is no authentication. |
| `DB_PATH` | `./data/quiz.db` | SQLite file (created on first start). |
| `WORKSPACE_ROOT` | `..` | Folder scanned by `npm run sync`. |

## Concepts

**Node tree.** One table, `nodes`, holds topics, subtopics and files, because workspace depth varies.
- Topic = root folder (`parent_id` null). Subtopic = any nested folder. File = leaf, `kind: "file"`.
- Every node has a `path` from the workspace root joined by `/`, e.g. `cloud_devops_basic/network/2 Domain 2 - Computer Networking Core Fundamentals/2_1 Network Fundamentals and Models/2_1_1 How Networks Transfer Data.md`. Paths are unique. Names cannot contain `/` or `\`.
- Only files hold questions. A file must live inside a folder. Folders cannot be turned into files.

**What `npm run sync` imports.** Only `.md` files named like a lesson (`<N>_<M>_<P> <title>.md`) plus the folders leading to them. It skips `README.md`, `CHECKLIST.md`, `.git`, `.agents`, `.evidence`, `.vscode`, `node_modules` and `quiz-app`. A topic with no lesson files yet (for example `aws`, `java` today) does not appear until it has some; you can also create nodes by hand.

**Question shape.**

```json
{
  "question": "Which layer does a **router** use?\n\n```mermaid\nflowchart LR\n  A[Host] --> R((Router)) --> B[Host]\n```",
  "options": { "A": "Layer 2", "B": "Layer 3", "C": "Layer 4", "D": "Layer 7" },
  "correct": "B",
  "explanation": "Routers forward by **IP address**, a layer 3 concept.",
  "hints": ["Which header carries the IP address?", "Same layer as ICMP."]
}
```

- `question`, all four options, and `correct` (`A`..`D`, case-insensitive on input) are required. `explanation` and `hints` are optional (`hints` may be `[]` or missing).
- The flat style is also accepted on input: `option_a`..`option_d`, `hint_1`, `hint_2`, ...
- Output always uses the nested shape above.

**Scoring.** Only the **latest** answer to a question counts. Status is `correct`, `wrong` or `unanswered`.
- File score = latest-correct / total questions. A folder or topic adds up all files below it.
- Every attempt is kept in `answers` (with `hints_used`) for the dashboard history. Hints do not reduce the score.
- Every stats object is `{ "questions": N, "answered": N, "correct": N }`.

**Quiz mode hides answers.** `GET /api/files/:id/questions` leaves out `correct`, `explanation` and hint text for questions not yet answered (it returns `hint_count`). Use `?mode=edit` to get everything.

## API reference

Base URL `http://127.0.0.1:3000/api`. JSON in and out. Errors are `{ "error": "message" }` with status `400` (validation), `404` (not found) or `409` (duplicate name/path, or wrong node kind).

### Tree

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/nodes` | Root topics with stats. |
| GET | `/nodes/:id` | Node + `children` (with stats) + `breadcrumb`. |
| GET | `/nodes/by-path?path=<url-encoded>` | Find a node by workspace path. |
| POST | `/nodes` | Create `{ "parent_id": 12 \| null, "kind": "folder" \| "file", "name": "..." }`. |
| PATCH | `/nodes/:id` | Rename / move / reorder: any of `name`, `parent_id`, `position`. Descendant paths are rewritten. |
| DELETE | `/nodes/:id` | Delete the node and everything below it (questions, hints, answers). |

```bash
curl -s localhost:3000/api/nodes
curl -s -G localhost:3000/api/nodes/by-path --data-urlencode 'path=azure/az-104'
curl -s -X POST localhost:3000/api/nodes -H 'content-type: application/json' \
  -d '{"parent_id":null,"kind":"folder","name":"java"}'
curl -s -X PATCH localhost:3000/api/nodes/5 -H 'content-type: application/json' -d '{"name":"new name"}'
curl -s -X DELETE localhost:3000/api/nodes/5
```

### Questions

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/files/:fileId/questions` | Quiz mode (answers hidden until answered). Includes `stats` and each question's `latest` answer. |
| GET | `/files/:fileId/questions?mode=edit` | Everything: `correct`, `explanation`, all `hints`. |
| GET | `/questions/:id` | One question, full. |
| GET | `/questions/:id/hints/:n` | Reveal hint `n` (1-based). |
| POST | `/files/:fileId/questions` | Create one. |
| POST | `/files/:fileId/questions/bulk` | Create many in one transaction: `{ "questions": [...], "replace": false }`. If any item is invalid nothing is written and the error names it (`questions[3]: option C is required`). `replace: true` first deletes the file's existing questions **and their answers**. |
| PUT | `/questions/:id` | Full update. `hints` replaces the whole hint list. |
| PATCH | `/questions/:id` | Partial update (`options` merges per letter, `hints` replaces, `position` reorders). |
| DELETE | `/questions/:id` | Delete (hints and answers cascade). |

```bash
curl -s -X POST localhost:3000/api/files/7/questions -H 'content-type: application/json' -d '{
  "question":"2 + 2 = ?","options":{"A":"3","B":"4","C":"5","D":"6"},"correct":"B",
  "explanation":"Basic arithmetic.","hints":["Count on your fingers."]}'
curl -s "localhost:3000/api/files/7/questions?mode=edit"
curl -s localhost:3000/api/questions/12/hints/1
curl -s -X PATCH localhost:3000/api/questions/12 -H 'content-type: application/json' -d '{"correct":"C"}'
```

### Answers

| Method | Path | Purpose |
| :--- | :--- | :--- |
| POST | `/questions/:id/answers` | Submit `{ "selected": "B", "hints_used": 1 }` → `{ is_correct, correct, explanation, file_stats }`. |
| GET | `/questions/:id/answers` | Attempt history, newest first. |
| DELETE | `/questions/:id/answers` | Reset one question. |
| DELETE | `/files/:id/answers` | Reset a whole file. |
| DELETE | `/nodes/:id/answers` | Reset everything under a folder/topic (also works on files). |

```bash
curl -s -X POST localhost:3000/api/questions/12/answers -H 'content-type: application/json' -d '{"selected":"B"}'
curl -s -X DELETE localhost:3000/api/files/7/answers
```

### Stats / dashboard

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/stats` | Totals (`questions`, `answered`, `correct`, `attempts`, `accuracy` = % of answered, `score` = % of all) and per-topic breakdown. |
| GET | `/stats/files?under=:nodeId&sort=score` | Per-file table (files with questions only). `sort=score` lists the weakest first, unattempted files last. `under` limits to a subtree. |
| GET | `/stats/recent?limit=20` | Latest attempts with file path and result. |
| GET | `/stats/daily?days=30` | Attempts and correct per day (local time). |
| GET | `/health` | `{ "ok": true, "db": "<path>" }`. |

## Agent recipe: add a quiz to a lesson

1. Make sure the server is running (`npm start`, see `GET /api/health`) and the tree is current (`npm run sync`).
2. Find the file's id. Use the path relative to the workspace root, exactly as on disk:
   ```bash
   curl -s -G localhost:3000/api/nodes/by-path \
     --data-urlencode 'path=cloud_devops_basic/network/2 Domain 2 - Computer Networking Core Fundamentals/2_1 Network Fundamentals and Models/2_1_1 How Networks Transfer Data.md'
   ```
   `404` means the file is not in the tree yet: run `npm run sync` (or create the nodes with `POST /api/nodes`).
3. Read the lesson `.md` file and write the questions from it.
4. Send them in one request (write the JSON to a file first so quoting is not an issue):
   ```bash
   curl -s -X POST localhost:3000/api/files/<id>/questions/bulk \
     -H 'content-type: application/json' --data @questions.json
   ```
   Use `"replace": true` only when you intend to overwrite the existing questions and their answers.
5. Verify: `curl -s "localhost:3000/api/files/<id>/questions?mode=edit"` and check `stats.questions`.
6. To read results later: `GET /api/nodes/<id>` for a score, `GET /api/stats/files?sort=score` for weak spots.

## Question authoring rules (for agents)

- Exactly four options A-D, exactly one correct. Do not put "A." or "(A)" inside the option text; the UI adds the letter.
- Markdown works in every text field. Put diagrams in ` ```mermaid ` fences. Check that the Mermaid source is valid: a broken diagram is shown as an error block with the source, but it is still a bad question.
- Keep options short so they stay readable. Avoid "all of the above" / "none of the above".
- `explanation`: say why the correct option is right and why the tempting wrong ones are wrong.
- `hints`: ordered from vague to specific; the last one should not give the answer away outright.
- Facts must follow the workspace rules in [AGENTS.md](../AGENTS.md): base them on the lesson file and Tier 1 official documentation, and do not invent flags, limits or behavior. If you are unsure of a fact, leave the question out.
- Stay on-topic for the lesson file the questions are attached to.

## Data

- Database: `data/quiz.db` (SQLite, WAL mode, so `quiz.db-wal` and `quiz.db-shm` appear next to it). Git-ignored.
- **Backup**: stop the server, then copy `data/quiz.db`. The `-wal`/`-shm` files are only needed if the server was killed mid-write; copying while stopped is the safe way.
- **Reset everything**: stop the server, delete `data/quiz.db*`, start again, run `npm run sync`.
- Schema: [src/schema.sql](src/schema.sql). Tables: `nodes`, `questions`, `hints`, `answers`; view `latest_answers`.

## Layout

```text
quiz-app/
├── src/
│   ├── server.js        # express app, static files, error handler
│   ├── db.js            # open DB, apply schema, tx() helper
│   ├── schema.sql
│   ├── validate.js      # validation + flat/nested question normalization
│   ├── stats.js         # score queries (recursive CTE over nodes)
│   └── routes/          # nodes.js, questions.js, answers.js, stats.js
├── scripts/sync-workspace.js
├── public/              # index.html, app.js, markdown.js, style.css
├── test/api.test.js
└── data/                # quiz.db (runtime)
```

Quiz keyboard shortcuts: `A`-`D` (or `1`-`4`) choose an option, `Enter` submits, `H` reveals the next hint. They act on the first unanswered question on screen.

UI routes: `#/` topics, `#/node/:id` folder, `#/file/:id` quiz, `#/file/:id/edit` editor (with live preview and JSON bulk import), `#/dashboard`.

Build plan: [.agents/plans/quiz-app-plan.md](../.agents/plans/quiz-app-plan.md).

## 📚 Nguồn Tài Liệu Chính Thống (Official References)

- [Express routing guide](https://expressjs.com/en/guide/routing.html) - Official Express documentation on routing.
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md) - Official API docs of the SQLite driver used here.
- [SQLite SQL language reference](https://sqlite.org/lang.html) - Official SQLite SQL syntax, including recursive CTEs and views.
- [Mermaid flowchart syntax](https://mermaid.js.org/syntax/flowchart.html) - Official Mermaid documentation for diagrams in questions.
- [marked documentation](https://marked.js.org/) - Official docs of the Markdown parser.
- [DOMPurify](https://github.com/cure53/DOMPurify) - Official repository of the HTML sanitizer.
