import { Router } from 'express';
import { HttpError, parseId, validateName } from '../validate.js';
import { nodeStats, withStats } from '../stats.js';
import { tx } from '../db.js';

export default function nodesRouter(db) {
  const r = Router();
  const get = (id) => db.prepare('SELECT * FROM nodes WHERE id = ?').get(id);
  const need = (id) => {
    const n = get(id);
    if (!n) throw new HttpError(404, `node ${id} not found`);
    return n;
  };
  const breadcrumb = (node) => {
    const out = [];
    for (let n = node; n; n = n.parent_id ? get(n.parent_id) : null) out.unshift({ id: n.id, name: n.name, kind: n.kind });
    return out;
  };
  const children = (id) =>
    db.prepare('SELECT * FROM nodes WHERE parent_id = ? ORDER BY position, name').all(id);

  r.get('/nodes', (req, res) => {
    const roots = db.prepare('SELECT * FROM nodes WHERE parent_id IS NULL ORDER BY position, name').all();
    res.json(withStats(db, roots));
  });

  r.get('/nodes/by-path', (req, res) => {
    const p = req.query.path;
    if (typeof p !== 'string' || !p) throw new HttpError(400, 'path query parameter required');
    const node = db.prepare('SELECT * FROM nodes WHERE path = ?').get(p);
    if (!node) throw new HttpError(404, `no node with path "${p}" (run "npm run sync" if the lesson file is new)`);
    res.json({ ...node, stats: nodeStats(db, node.id) });
  });

  r.get('/nodes/:id', (req, res) => {
    const node = need(parseId(req.params.id));
    res.json({
      ...node,
      stats: nodeStats(db, node.id),
      breadcrumb: breadcrumb(node),
      children: withStats(db, children(node.id)),
    });
  });

  r.post('/nodes', (req, res) => {
    const { parent_id = null, kind, position } = req.body ?? {};
    const name = validateName(req.body?.name);
    if (!['folder', 'file'].includes(kind)) throw new HttpError(400, 'kind must be "folder" or "file"');
    let parentPath = null;
    if (parent_id !== null) {
      const parent = need(parseId(parent_id, 'parent_id'));
      if (parent.kind !== 'folder') throw new HttpError(409, 'parent must be a folder');
      parentPath = parent.path;
    } else if (kind === 'file') {
      throw new HttpError(409, 'a file must live inside a folder (topic)');
    }
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (db.prepare('SELECT 1 FROM nodes WHERE path = ?').get(path)) throw new HttpError(409, `"${path}" already exists`);
    const pos =
      position ??
      db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM nodes WHERE parent_id IS ?').get(parent_id).p;
    const info = db
      .prepare('INSERT INTO nodes (parent_id, kind, name, path, position) VALUES (?, ?, ?, ?, ?)')
      .run(parent_id, kind, name, path, pos);
    res.status(201).json(get(info.lastInsertRowid));
  });

  r.patch('/nodes/:id', (req, res) => {
    const node = need(parseId(req.params.id));
    const body = req.body ?? {};
    const newName = 'name' in body ? validateName(body.name) : node.name;
    let newParentId = node.parent_id;
    if ('parent_id' in body) newParentId = body.parent_id === null ? null : parseId(body.parent_id, 'parent_id');
    if ('position' in body && !Number.isInteger(body.position)) throw new HttpError(400, 'position must be an integer');

    let parentPath = null;
    if (newParentId !== null) {
      const parent = need(newParentId);
      if (parent.kind !== 'folder') throw new HttpError(409, 'parent must be a folder');
      if (parent.id === node.id || parent.path === node.path || parent.path.startsWith(node.path + '/')) {
        throw new HttpError(409, 'cannot move a node into itself or its own descendant');
      }
      parentPath = parent.path;
    } else if (node.kind === 'file') {
      throw new HttpError(409, 'a file must live inside a folder (topic)');
    }
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;

    tx(db, () => {
      if (newPath !== node.path) {
        if (db.prepare('SELECT 1 FROM nodes WHERE path = ?').get(newPath)) throw new HttpError(409, `"${newPath}" already exists`);
        db.prepare(
          `UPDATE nodes SET path = @np || substr(path, @len + 1)
           WHERE path = @old OR substr(path, 1, @len + 1) = @old || '/'`,
        ).run({ np: newPath, len: node.path.length, old: node.path });
      }
      db.prepare(
        `UPDATE nodes SET name = ?, parent_id = ?, position = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?`,
      ).run(newName, newParentId, body.position ?? node.position, node.id);
    });
    res.json(get(node.id));
  });

  r.delete('/nodes/:id', (req, res) => {
    const node = need(parseId(req.params.id));
    db.prepare('DELETE FROM nodes WHERE id = ?').run(node.id);
    res.json({ deleted: node.id });
  });

  return r;
}
