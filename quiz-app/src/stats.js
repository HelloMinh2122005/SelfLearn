const SUBTREE = `WITH RECURSIVE sub(id) AS (
  SELECT @id UNION ALL SELECT n.id FROM nodes n JOIN sub s ON n.parent_id = s.id)`;

export function nodeStats(db, id) {
  return db
    .prepare(
      `${SUBTREE}
       SELECT COUNT(q.id) AS questions,
              COUNT(la.id) AS answered,
              COALESCE(SUM(la.is_correct), 0) AS correct
       FROM sub JOIN questions q ON q.file_id = sub.id
       LEFT JOIN latest_answers la ON la.question_id = q.id`,
    )
    .get({ id });
}

export function withStats(db, rows) {
  return rows.map((r) => ({ ...r, stats: nodeStats(db, r.id) }));
}

export function subtreeSql() {
  return SUBTREE;
}
