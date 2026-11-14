// Mirror the workspace's lesson files into the quiz database (additive, idempotent).
//   npm run sync                 create missing folders/files
//   npm run sync -- --dry-run    only print what would be created
//   npm run sync -- --prune      also delete nodes whose path is gone, but ONLY if they hold no questions
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, tx } from '../src/db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const workspace = path.resolve(appRoot, process.env.WORKSPACE_ROOT ?? '..');
const dbPath = path.resolve(process.env.DB_PATH ?? path.join(appRoot, 'data/quiz.db'));
const dryRun = process.argv.includes('--dry-run');
const prune = process.argv.includes('--prune');

const SKIP_DIRS = new Set(['.git', '.agents', '.evidence', '.vscode', 'node_modules', 'quiz-app', '.idea']);
const LESSON = /^\d+_\d+_\d+ .*\.md$/;
const collator = new Intl.Collator('en', { numeric: true });

/** Returns [{ path, kind }] in tree order; only folders that lead to at least one lesson. */
function scan(dir, rel = '') {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => collator.compare(a.name, b.name));
  for (const e of entries) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
      const sub = scan(path.join(dir, e.name), p);
      if (sub.length) out.push({ path: p, kind: 'folder' }, ...sub);
    } else if (e.isFile() && LESSON.test(e.name) && rel) {
      out.push({ path: p, kind: 'file' });
    }
  }
  return out;
}

const found = scan(workspace);
const db = openDb(dbPath);
const byPath = new Map(db.prepare('SELECT id, path FROM nodes').all().map((n) => [n.path, n.id]));
let folders = 0, files = 0, present = 0;

function run() {
  const insert = db.prepare('INSERT INTO nodes (parent_id, kind, name, path, position) VALUES (?, ?, ?, ?, ?)');
  const counters = new Map(); // parent path -> next position
  for (const n of found) {
    if (byPath.has(n.path)) { present++; continue; }
    const i = n.path.lastIndexOf('/');
    const parentPath = i === -1 ? null : n.path.slice(0, i);
    const name = i === -1 ? n.path : n.path.slice(i + 1);
    const parentId = parentPath ? byPath.get(parentPath) ?? null : null;
    if (n.kind === 'folder') folders++; else files++;
    if (dryRun) { console.log(`+ ${n.kind.padEnd(6)} ${n.path}`); byPath.set(n.path, -1); continue; }
    const key = parentPath ?? '';
    if (!counters.has(key)) {
      counters.set(key, db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM nodes WHERE parent_id IS ?').get(parentId).p);
    }
    const pos = counters.get(key);
    counters.set(key, pos + 1);
    byPath.set(n.path, insert.run(parentId, n.kind, name, n.path, pos).lastInsertRowid);
  }
}
dryRun ? run() : tx(db, run);
console.log(`${dryRun ? '[dry-run] would create' : 'created'} ${folders} folders, ${files} files; ${present} already present`);

if (prune) {
  const onDisk = new Set(found.map((n) => n.path));
  const gone = db.prepare('SELECT id, path, kind FROM nodes ORDER BY length(path) DESC').all().filter((n) => !onDisk.has(n.path));
  let removed = 0;
  for (const n of gone) {
    const withQs = db
      .prepare(
        `WITH RECURSIVE sub(id) AS (SELECT ? UNION ALL SELECT x.id FROM nodes x JOIN sub s ON x.parent_id = s.id)
         SELECT COUNT(*) AS c FROM questions q JOIN sub ON q.file_id = sub.id`,
      )
      .get(n.id).c;
    if (withQs) { console.log(`kept (has ${withQs} questions): ${n.path}`); continue; }
    if (dryRun) { console.log(`- would delete ${n.path}`); continue; }
    db.prepare('DELETE FROM nodes WHERE id = ?').run(n.id);
    removed++;
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}prune: ${removed} removed`);
}
