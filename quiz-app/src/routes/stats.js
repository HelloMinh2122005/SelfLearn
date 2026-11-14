import { Router } from 'express';
import { parseId } from '../validate.js';
import { subtreeSql, withStats } from '../stats.js';

export default function statsRouter(db) {
  const r = Router();
  const pct = (c, q) => (q ? Math.round((c / q) * 1000) / 10 : null);

  r.get('/stats', (req, res) => {
    const t = db
      .prepare(
        `SELECT COUNT(q.id) AS questions, COUNT(la.id) AS answered, COALESCE(SUM(la.is_correct),0) AS correct
         FROM questions q LEFT JOIN latest_answers la ON la.question_id = q.id`,
      )
      .get();
    const attempts = db.prepare('SELECT COUNT(*) AS n FROM answers').get().n;
    const roots = withStats(db, db.prepare('SELECT id, name, path FROM nodes WHERE parent_id IS NULL ORDER BY position, name').all());
    res.json({
      ...t,
      attempts,
      accuracy: pct(t.correct, t.answered), // % correct among answered questions
      score: pct(t.correct, t.questions), // % correct among all questions
      topics: roots.map((x) => ({ ...x, stats: { ...x.stats, accuracy: pct(x.stats.correct, x.stats.answered), score: pct(x.stats.correct, x.stats.questions) } })),
    });
  });

  r.get('/stats/files', (req, res) => {
    const params = {};
    let scope = '';
    if (req.query.under) {
      params.id = parseId(req.query.under, 'under');
      scope = `${subtreeSql()}`;
    }
    const rows = db
      .prepare(
        `${scope}
         SELECT n.id, n.path, COUNT(q.id) AS questions, COUNT(la.id) AS answered,
                COALESCE(SUM(la.is_correct),0) AS correct,
                (SELECT MAX(a.answered_at) FROM answers a JOIN questions q2 ON q2.id = a.question_id WHERE q2.file_id = n.id) AS last_answered
         FROM nodes n JOIN questions q ON q.file_id = n.id
         LEFT JOIN latest_answers la ON la.question_id = q.id
         ${req.query.under ? 'WHERE n.id IN (SELECT id FROM sub)' : ''}
         GROUP BY n.id`,
      )
      .all(params)
      .map((f) => ({ ...f, score: pct(f.correct, f.questions) }));
    if (req.query.sort === 'score') {
      // weakest first; files never attempted go last
      rows.sort((a, b) => (a.answered === 0) - (b.answered === 0) || a.score - b.score || a.path.localeCompare(b.path));
    } else rows.sort((a, b) => a.path.localeCompare(b.path));
    res.json(rows);
  });

  r.get('/stats/recent', (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);
    const rows = db
      .prepare(
        `SELECT a.id, a.question_id, a.selected, a.is_correct, a.hints_used, a.answered_at, n.id AS file_id, n.path
         FROM answers a JOIN questions q ON q.id = a.question_id JOIN nodes n ON n.id = q.file_id
         ORDER BY a.id DESC LIMIT ?`,
      )
      .all(limit);
    res.json(rows.map((x) => ({ ...x, is_correct: !!x.is_correct })));
  });

  r.get('/stats/daily', (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const rows = db
      .prepare(
        `SELECT date(answered_at, 'localtime') AS day, COUNT(*) AS attempts, SUM(is_correct) AS correct
         FROM answers WHERE date(answered_at, 'localtime') >= date('now', 'localtime', ?)
         GROUP BY day ORDER BY day`,
      )
      .all(`-${days - 1} days`);
    res.json(rows);
  });

  return r;
}
