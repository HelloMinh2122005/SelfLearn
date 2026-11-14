CREATE TABLE IF NOT EXISTS nodes (
  id          INTEGER PRIMARY KEY,
  parent_id   INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('folder','file')),
  name        TEXT NOT NULL,
  path        TEXT NOT NULL UNIQUE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (parent_id, name)
);

CREATE TABLE IF NOT EXISTS questions (
  id           INTEGER PRIMARY KEY,
  file_id      INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,
  question     TEXT NOT NULL,
  option_a     TEXT NOT NULL,
  option_b     TEXT NOT NULL,
  option_c     TEXT NOT NULL,
  option_d     TEXT NOT NULL,
  correct      TEXT NOT NULL CHECK (correct IN ('A','B','C','D')),
  explanation  TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS hints (
  id           INTEGER PRIMARY KEY,
  question_id  INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  content      TEXT NOT NULL,
  UNIQUE (question_id, position)
);

CREATE TABLE IF NOT EXISTS answers (
  id           INTEGER PRIMARY KEY,
  question_id  INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected     TEXT NOT NULL CHECK (selected IN ('A','B','C','D')),
  is_correct   INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  hints_used   INTEGER NOT NULL DEFAULT 0,
  answered_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_nodes_parent     ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_questions_file   ON questions(file_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id, id);

-- Latest answer per question (this is what scoring uses)
CREATE VIEW IF NOT EXISTS latest_answers AS
  SELECT a.* FROM answers a
  WHERE a.id = (SELECT MAX(id) FROM answers WHERE question_id = a.question_id);
