import { Router } from 'express';
import { HttpError, LETTERS, parseId } from '../validate.js';
import { nodeStats, subtreeSql } from '../stats.js';

export default function answersRouter(db) {
  const r = Router();
  const needQuestion = (id) => {
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!q) throw new HttpError(404, `question ${id} not found`);
    return q;
  };

  r.post('/questions/:id/answers', (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    const selected = typeof req.body?.selected === 'string' ? req.body.selected.trim().toUpperCase() : '';
    if (!LETTERS.includes(selected)) throw new HttpError(400, 'selected must be one of A, B, C, D');
    const hintsUsed = req.body?.hints_used ?? 0;
    if (!Number.isInteger(hintsUsed) || hintsUsed < 0) throw new HttpError(400, 'hints_used must be an integer >= 0');
    const isCorrect = selected === q.correct ? 1 : 0;
    const info = db
      .prepare('INSERT INTO answers (question_id, selected, is_correct, hints_used) VALUES (?, ?, ?, ?)')
      .run(q.id, selected, isCorrect, hintsUsed);
    res.status(201).json({
      id: info.lastInsertRowid,
      selected,
      is_correct: !!isCorrect,
      correct: q.correct,
      explanation: q.explanation,
      file_stats: nodeStats(db, q.file_id),
    });
  });

  r.get('/questions/:id/answers', (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    const rows = db
      .prepare('SELECT id, selected, is_correct, hints_used, answered_at FROM answers WHERE question_id = ? ORDER BY id DESC')
      .all(q.id);
    res.json(rows.map((a) => ({ ...a, is_correct: !!a.is_correct })));
  });

  r.delete('/questions/:id/answers', (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    const info = db.prepare('DELETE FROM answers WHERE question_id = ?').run(q.id);
    res.json({ deleted: info.changes, file_stats: nodeStats(db, q.file_id) });
  });

  // Works for a file, a subtopic or a whole topic: clears every answer in the subtree.
  const resetNode = (req, res) => {
    const id = parseId(req.params.id);
    if (!db.prepare('SELECT 1 FROM nodes WHERE id = ?').get(id)) throw new HttpError(404, `node ${id} not found`);
    const info = db
      .prepare(
        `${subtreeSql()}
         DELETE FROM answers WHERE question_id IN (
           SELECT q.id FROM questions q JOIN sub ON q.file_id = sub.id)`,
      )
      .run({ id });
    res.json({ deleted: info.changes, stats: nodeStats(db, id) });
  };
  r.delete('/nodes/:id/answers', resetNode);
  r.delete('/files/:id/answers', resetNode);

  return r;
}
