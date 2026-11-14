import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { createApp } from '../src/server.js';

let server, base;
before(async () => {
  const app = createApp(openDb(':memory:'), ':memory:');
  await new Promise((r) => (server = app.listen(0, '127.0.0.1', r)));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
const q = (over = {}) => ({
  question: 'Which layer does a router use?',
  options: { A: 'L2', B: 'L3', C: 'L4', D: 'L7' },
  correct: 'B',
  explanation: 'IP is L3.',
  hints: ['think IP', 'not L2'],
  ...over,
});

let topic, sub, dom, file1, file2;
test('tree: create topic, subtopic, folder, files', async () => {
  topic = (await call('POST', '/nodes', { kind: 'folder', name: 'net' })).body;
  sub = (await call('POST', '/nodes', { parent_id: topic.id, kind: 'folder', name: 'network' })).body;
  dom = (await call('POST', '/nodes', { parent_id: sub.id, kind: 'folder', name: '2 Domain 2' })).body;
  file1 = (await call('POST', '/nodes', { parent_id: dom.id, kind: 'file', name: '2_1_1 A.md' })).body;
  file2 = (await call('POST', '/nodes', { parent_id: dom.id, kind: 'file', name: '2_1_2 B.md' })).body;
  assert.equal(file1.path, 'net/network/2 Domain 2/2_1_1 A.md');
  const found = await call('GET', '/nodes/by-path?path=' + encodeURIComponent(file1.path));
  assert.equal(found.body.id, file1.id);
});

test('tree: duplicates 409, file under root 409, bad name 400', async () => {
  assert.equal((await call('POST', '/nodes', { kind: 'folder', name: 'net' })).status, 409);
  assert.equal((await call('POST', '/nodes', { parent_id: dom.id, kind: 'file', name: '2_1_1 A.md' })).status, 409);
  assert.equal((await call('POST', '/nodes', { parent_id: file1.id, kind: 'folder', name: 'x' })).status, 409);
  assert.equal((await call('POST', '/nodes', { kind: 'file', name: 'x.md' })).status, 409);
  assert.equal((await call('POST', '/nodes', { kind: 'folder', name: 'a/b' })).status, 400);
  assert.equal((await call('GET', '/nodes/9999')).status, 404);
});

test('questions: validation', async () => {
  const bad = q();
  delete bad.options.D;
  assert.equal((await call('POST', `/files/${file1.id}/questions`, bad)).status, 400);
  assert.equal((await call('POST', `/files/${file1.id}/questions`, q({ correct: 'E' }))).status, 400);
  assert.equal((await call('POST', `/files/${file1.id}/questions`, q({ hints: [''] }))).status, 400);
  assert.equal((await call('POST', `/files/${dom.id}/questions`, q())).status, 409);
});

let q1, q2;
test('questions: create (nested + flat), hints keep order, quiz mode hides answer', async () => {
  q1 = (await call('POST', `/files/${file1.id}/questions`, q())).body;
  assert.deepEqual(q1.hints, ['think IP', 'not L2']);
  q2 = (
    await call('POST', `/files/${file1.id}/questions`, {
      question: 'Flat?', option_a: 'a', option_b: 'b', option_c: 'c', option_d: 'd', correct: 'c', hint_2: 'two', hint_1: 'one',
    })
  ).body;
  assert.equal(q2.correct, 'C');
  assert.deepEqual(q2.hints, ['one', 'two']);
  const quiz = (await call('GET', `/files/${file1.id}/questions`)).body.questions;
  assert.equal(quiz.length, 2);
  assert.equal(quiz[0].correct, undefined);
  assert.equal(quiz[0].explanation, undefined);
  assert.equal(quiz[0].hints, undefined);
  assert.equal(quiz[0].hint_count, 2);
  const edit = (await call('GET', `/files/${file1.id}/questions?mode=edit`)).body.questions;
  assert.equal(edit[0].correct, 'B');
  assert.equal((await call('GET', `/questions/${q1.id}/hints/2`)).body.content, 'not L2');
  assert.equal((await call('GET', `/questions/${q1.id}/hints/3`)).status, 404);
});

test('questions: no hints is fine; PATCH merges; PUT replaces hints', async () => {
  const noHint = (await call('POST', `/files/${file2.id}/questions`, q({ hints: undefined }))).body;
  assert.deepEqual(noHint.hints, []);
  const p = (await call('PATCH', `/questions/${noHint.id}`, { options: { A: 'new A' }, correct: 'A' })).body;
  assert.equal(p.options.A, 'new A');
  assert.equal(p.options.B, 'L3');
  assert.equal(p.correct, 'A');
  const put = (await call('PUT', `/questions/${noHint.id}`, q({ hints: ['only'] }))).body;
  assert.deepEqual(put.hints, ['only']);
  assert.equal((await call('PATCH', `/questions/${noHint.id}`, { correct: 'Z' })).status, 400);
  await call('DELETE', `/questions/${noHint.id}`);
});

test('bulk: atomic on error, replace works', async () => {
  const badBulk = await call('POST', `/files/${file2.id}/questions/bulk`, { questions: [q(), q({ correct: 'X' })] });
  assert.equal(badBulk.status, 400);
  assert.match(badBulk.body.error, /questions\[1\]/);
  assert.equal((await call('GET', `/files/${file2.id}/questions`)).body.questions.length, 0);
  const ok = await call('POST', `/files/${file2.id}/questions/bulk`, { questions: [q(), q(), q()] });
  assert.equal(ok.body.created, 3);
  const rep = await call('POST', `/files/${file2.id}/questions/bulk`, { questions: [q()], replace: true });
  assert.equal(rep.body.stats.questions, 1);
});

test('answers: wrong then right counts as correct; stats; resets', async () => {
  const wrong = (await call('POST', `/questions/${q1.id}/answers`, { selected: 'A', hints_used: 1 })).body;
  assert.equal(wrong.is_correct, false);
  assert.equal(wrong.file_stats.correct, 0);
  const right = (await call('POST', `/questions/${q1.id}/answers`, { selected: 'b' })).body;
  assert.equal(right.is_correct, true);
  assert.equal(right.file_stats.correct, 1);
  assert.equal(right.file_stats.answered, 2 - 1); // q2 unanswered
  assert.equal((await call('GET', `/questions/${q1.id}/answers`)).body.length, 2);
  assert.equal((await call('POST', `/questions/${q1.id}/answers`, { selected: 'E' })).status, 400);

  // quiz mode now reveals the answer for q1 only
  const quiz = (await call('GET', `/files/${file1.id}/questions`)).body.questions;
  assert.equal(quiz[0].correct, 'B');
  assert.equal(quiz[1].correct, undefined);

  await call('POST', `/questions/${q2.id}/answers`, { selected: 'C' });
  await call('POST', `/questions/${(await call('GET', `/files/${file2.id}/questions`)).body.questions[0].id}/answers`, { selected: 'D' });

  // folder stats = sum of files
  const f1 = (await call('GET', `/nodes/${file1.id}`)).body.stats;
  const f2 = (await call('GET', `/nodes/${file2.id}`)).body.stats;
  const d = (await call('GET', `/nodes/${dom.id}`)).body.stats;
  assert.equal(d.questions, f1.questions + f2.questions);
  assert.equal(d.correct, f1.correct + f2.correct);
  assert.equal(d.answered, f1.answered + f2.answered);

  const stats = (await call('GET', '/stats')).body;
  assert.equal(stats.questions, 3);
  assert.equal(stats.attempts, 4);
  const files = (await call('GET', `/stats/files?under=${sub.id}&sort=score`)).body;
  assert.equal(files.length, 2);
  assert.equal(files[0].path, file2.path); // 0% first
  assert.equal((await call('GET', '/stats/recent?limit=2')).body.length, 2);
  assert.ok((await call('GET', '/stats/daily?days=7')).body[0].attempts >= 4);

  // reset one question
  assert.equal((await call('DELETE', `/questions/${q1.id}/answers`)).body.deleted, 2);
  assert.equal((await call('GET', `/nodes/${file1.id}`)).body.stats.answered, 1);
  // reset a whole folder
  assert.equal((await call('DELETE', `/nodes/${dom.id}/answers`)).body.deleted, 2);
  assert.deepEqual((await call('GET', `/nodes/${dom.id}`)).body.stats, { questions: 3, answered: 0, correct: 0 });
});

test('tree: rename rewrites descendant paths; move guards; delete cascades', async () => {
  const ren = await call('PATCH', `/nodes/${sub.id}`, { name: 'networking' });
  assert.equal(ren.status, 200);
  const f = (await call('GET', `/nodes/${file1.id}`)).body;
  assert.equal(f.path, 'net/networking/2 Domain 2/2_1_1 A.md');
  assert.deepEqual(f.breadcrumb.map((b) => b.name), ['net', 'networking', '2 Domain 2', '2_1_1 A.md']);
  assert.equal((await call('PATCH', `/nodes/${sub.id}`, { parent_id: dom.id })).status, 409);
  assert.equal((await call('PATCH', `/nodes/${file1.id}`, { name: '2_1_2 B.md' })).status, 409);
  await call('DELETE', `/nodes/${topic.id}`);
  assert.equal((await call('GET', `/nodes/${file1.id}`)).status, 404);
  assert.equal((await call('GET', `/questions/${q1.id}`)).status, 404);
  assert.equal((await call('GET', '/stats')).body.questions, 0);
});

test('bad JSON -> 400, unknown endpoint -> 404', async () => {
  const res = await fetch(base + '/nodes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
  assert.equal((await call('GET', '/nope')).status, 404);
});
