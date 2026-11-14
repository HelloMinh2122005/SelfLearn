import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { HttpError } from './validate.js';
import nodesRouter from './routes/nodes.js';
import questionsRouter from './routes/questions.js';
import answersRouter from './routes/answers.js';
import statsRouter from './routes/stats.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp(db, dbPath = '') {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ ok: true, db: dbPath }));
  api.use(nodesRouter(db));
  api.use(questionsRouter(db));
  api.use(answersRouter(db));
  api.use(statsRouter(db));
  api.use((req, res) => res.status(404).json({ error: `no such endpoint: ${req.method} ${req.originalUrl}` }));
  app.use('/api', api);

  // Browser libraries are served straight from node_modules (works offline, no build step).
  const nm = path.join(root, 'node_modules');
  app.use('/vendor/marked', express.static(path.join(nm, 'marked/lib')));
  app.use('/vendor/dompurify', express.static(path.join(nm, 'dompurify/dist')));
  app.use('/vendor/mermaid', express.static(path.join(nm, 'mermaid/dist')));
  app.use(express.static(path.join(root, 'public')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid JSON body' });
    if (err.code?.startsWith?.('SQLITE_CONSTRAINT')) return res.status(409).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '127.0.0.1';
  const dbPath = path.resolve(process.env.DB_PATH ?? path.join(root, 'data/quiz.db'));
  const app = createApp(openDb(dbPath), dbPath);
  app.listen(port, host, () => console.log(`quiz-app on http://${host}:${port}  (db: ${dbPath})`));
}
