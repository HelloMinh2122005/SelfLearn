import { Router } from 'express';
import { HttpError, parseId, pickQuestionFields, validateQuestion } from '../validate.js';
import { tx } from '../db.js';
import { nodeStats } from '../stats.js';

export default function questionsRouter(db) {
  const r = Router();

  const needFile = (id) => {
    const n = db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
    if (!n) throw new HttpError(404, `node ${id} not found`);
    if (n.kind !== 'file') throw new HttpError(409, `node ${id} is a folder; questions belong to files`);
    return n;
  };
  const needQuestion = (id) => {
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!q) throw new HttpError(404, `question ${id} not found`);
    return q;
  };
  const hintsOf = (qid) =>
    db.prepare('SELECT content FROM hints WHERE question_id = ? ORDER BY position').all(qid).map((h) => h.content);
  const latestOf = (qid) =>
    db
      .prepare('SELECT selected, is_correct, hints_used, answered_at FROM latest_answers WHERE question_id = ?')
      .get(qid) ?? null;

  const full = (q) => ({
    id: q.id,
    file_id: q.file_id,
    position: q.position,
    question: q.question,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    correct: q.correct,
    explanation: q.explanation,
    hints: hintsOf(q.id),
    created_at: q.created_at,
    updated_at: q.updated_at,
  });

  // quiz mode: never leak the answer before the user has answered
  const quizView = (q) => {
    const latest = latestOf(q.id);
    const f = full(q);
    const base = {
      id: f.id,
      file_id: f.file_id,
      position: f.position,
      question: f.question,
      options: f.options,
      hint_count: f.hints.length,
      latest,
    };
    return latest ? { ...base, correct: f.correct, explanation: f.explanation, hints: f.hints } : base;
  };

  const insertQuestion = (fileId, v) => {
    const position =
      v.position ?? db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM questions WHERE file_id = ?').get(fileId).p;
    const info = db
      .prepare(
        `INSERT INTO questions (file_id, position, question, option_a, option_b, option_c, option_d, correct, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(fileId, position, v.question, v.options.A, v.options.B, v.options.C, v.options.D, v.correct, v.explanation);
    writeHints(info.lastInsertRowid, v.hints);
    return info.lastInsertRowid;
  };
  const writeHints = (qid, hints) => {
    db.prepare('DELETE FROM hints WHERE question_id = ?').run(qid);
    const ins = db.prepare('INSERT INTO hints (question_id, position, content) VALUES (?, ?, ?)');
    hints.forEach((h, i) => ins.run(qid, i + 1, h));
  };
  const updateQuestion = (qid, v) => {
    db.prepare(
      `UPDATE questions SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct=?, explanation=?,
         position = COALESCE(?, position), updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?`,
    ).run(v.question, v.options.A, v.options.B, v.options.C, v.options.D, v.correct, v.explanation, v.position ?? null, qid);
    writeHints(qid, v.hints);
  };

  r.get('/files/:fileId/questions', (req, res) => {
    const file = needFile(parseId(req.params.fileId, 'fileId'));
    const rows = db.prepare('SELECT * FROM questions WHERE file_id = ? ORDER BY position, id').all(file.id);
    const edit = req.query.mode === 'edit';
    res.json({
      file: { id: file.id, name: file.name, path: file.path },
      stats: nodeStats(db, file.id),
      questions: rows.map((q) => (edit ? full(q) : quizView(q))),
    });
  });

  r.post('/files/:fileId/questions/bulk', (req, res) => {
    const file = needFile(parseId(req.params.fileId, 'fileId'));
    const list = req.body?.questions;
    if (!Array.isArray(list) || list.length === 0) throw new HttpError(400, 'questions must be a non-empty array');
    // validate everything first so a bad item changes nothing
    const valid = list.map((item, i) => {
      try {
        return validateQuestion(pickQuestionFields(item));
      } catch (e) {
        if (e instanceof HttpError) throw new HttpError(400, `questions[${i}]: ${e.message}`);
        throw e;
      }
    });
    const ids = tx(db, () => {
      if (req.body.replace === true) db.prepare('DELETE FROM questions WHERE file_id = ?').run(file.id);
      return valid.map((v) => insertQuestion(file.id, v));
    });
    res.status(201).json({ created: ids.length, ids, stats: nodeStats(db, file.id) });
  });

  r.post('/files/:fileId/questions', (req, res) => {
    const file = needFile(parseId(req.params.fileId, 'fileId'));
    const v = validateQuestion(pickQuestionFields(req.body));
    const id = tx(db, () => insertQuestion(file.id, v));
    res.status(201).json(full(needQuestion(id)));
  });

  r.get('/questions/:id', (req, res) => res.json(full(needQuestion(parseId(req.params.id)))));

  r.get('/questions/:id/hints/:n', (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    const n = parseId(req.params.n, 'hint number');
    const h = db.prepare('SELECT content FROM hints WHERE question_id = ? AND position = ?').get(q.id, n);
    if (!h) throw new HttpError(404, `question ${q.id} has no hint ${n}`);
    res.json({ n, content: h.content, total: hintsOf(q.id).length });
  });

  const save = (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    const patch = pickQuestionFields(req.body);
    let base = {};
    if (req.method === 'PATCH') {
      const f = full(q);
      base = { question: f.question, options: f.options, correct: f.correct, explanation: f.explanation, hints: f.hints };
      patch.options = { ...base.options, ...(patch.options ?? {}) };
    }
    const v = validateQuestion({ ...base, ...patch });
    tx(db, () => updateQuestion(q.id, v));
    res.json(full(needQuestion(q.id)));
  };
  r.put('/questions/:id', save);
  r.patch('/questions/:id', save);

  r.delete('/questions/:id', (req, res) => {
    const q = needQuestion(parseId(req.params.id));
    db.prepare('DELETE FROM questions WHERE id = ?').run(q.id);
    res.json({ deleted: q.id });
  });

  return r;
}
