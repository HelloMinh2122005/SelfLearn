// Simple hash-routed UI. No framework, no build step.
const app = document.getElementById('app');

// ---------- helpers ----------
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (['value', 'checked', 'disabled'].includes(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const pct = (c, q) => (q ? Math.round((c / q) * 100) : 0);
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const md = (text, cls = '') => {
  const d = h('div', { class: cls });
  renderMarkdown(d, text);
  return d;
};
function errBox(e) {
  return h('div', { class: 'err' }, e.message ?? String(e));
}

const ICONS = {
  folder: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
};
function icon(kind) {
  const el = h('span', { class: 'ico ' + kind });
  el.innerHTML = ICONS[kind]; // static, trusted strings
  return el;
}
const displayName = (n) => n.replace(/\.md$/, '');
// colour by accuracy among answered questions
const tone = (s) => (!s.answered ? '' : pct(s.correct, s.answered) >= 80 ? 'hi' : pct(s.correct, s.answered) >= 50 ? 'mid' : 'lo');

function statCell(s) {
  if (!s.questions) return h('div', { class: 'stat muted' }, 'No questions');
  return h(
    'div',
    { class: 'stat' },
    h('div', { class: 'stat-top' }, h('b', {}, `${s.correct} / ${s.questions}`), h('span', { class: 'muted' }, s.answered ? `${pct(s.correct, s.questions)}%` : 'not started')),
    h('div', { class: `bar ${tone(s)}` }, h('span', { style: `width:${pct(s.correct, s.questions)}%` })),
  );
}

function crumbs(list, last) {
  const parts = [h('a', { href: '#/' }, 'Topics')];
  for (const c of list) parts.push(' / ', c.id === last ? c.name : h('a', { href: `#/node/${c.id}` }, c.name));
  return h('div', { class: 'crumbs' }, parts);
}

// ---------- views ----------
async function homeView() {
  const [roots, s] = await Promise.all([api('GET', '/nodes'), api('GET', '/stats')]);
  const el = h('div');
  const summary = `${s.questions} questions · ${s.answered} answered` + (s.accuracy != null ? ` · ${s.accuracy}% accuracy` : '');
  el.append(
    h('div', { class: 'pagehead' },
      h('div', {}, h('h1', {}, 'Topics'), h('p', { class: 'muted' }, summary)),
      h('button', { class: 'primary', onclick: () => createNode(null, 'folder') }, 'New topic')),
  );
  if (!roots.length) {
    el.append(h('div', { class: 'list' }, h('div', { class: 'empty' }, 'No topics yet. Run "npm run sync" in quiz-app/ to import the workspace, or create one.')));
  } else {
    el.append(h('div', { class: 'list' }, roots.map(nodeRow)));
  }
  return el;
}

function nodeRow(n) {
  const href = n.kind === 'file' ? `#/file/${n.id}` : `#/node/${n.id}`;
  return h(
    'div',
    { class: 'row' },
    icon(n.kind),
    h('a', { class: 'name', href, title: n.name }, displayName(n.name)),
    statCell(n.stats),
    h(
      'div',
      { class: 'actions' },
      h('button', { onclick: () => renameNode(n) }, 'Rename'),
      h('button', { class: 'danger', onclick: () => deleteNode(n) }, 'Delete'),
    ),
  );
}

async function createNode(parentId, kind) {
  const name = prompt(`Name of the new ${parentId === null ? 'topic' : kind}:`);
  if (!name) return;
  try {
    await api('POST', '/nodes', { parent_id: parentId, kind, name });
    route();
  } catch (e) {
    alert(e.message);
  }
}
async function renameNode(n) {
  const name = prompt('New name:', n.name);
  if (!name || name === n.name) return;
  try {
    await api('PATCH', `/nodes/${n.id}`, { name });
    route();
  } catch (e) {
    alert(e.message);
  }
}
async function deleteNode(n) {
  const extra = n.stats?.questions ? `\n\nThis also deletes ${n.stats.questions} question(s) and all their answers.` : '';
  if (!confirm(`Delete "${n.name}" and everything inside it?${extra}`)) return;
  try {
    await api('DELETE', `/nodes/${n.id}`);
    location.hash = n.parent_id ? `#/node/${n.parent_id}` : '#/';
    route();
  } catch (e) {
    alert(e.message);
  }
}
async function resetAnswers(id, label, afterFn) {
  if (!confirm(`Delete all your answers under "${label}"? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/nodes/${id}/answers`);
    afterFn ? afterFn() : route();
  } catch (e) {
    alert(e.message);
  }
}

async function nodeView(id) {
  const n = await api('GET', `/nodes/${id}`);
  if (n.kind === 'file') {
    location.replace(`#/file/${id}`);
    return null;
  }
  const el = h('div');
  el.append(
    crumbs(n.breadcrumb, n.id),
    h('div', { class: 'pagehead' },
      h('div', {}, h('h1', {}, displayName(n.name)), h('p', { class: 'muted small' }, n.path)),
      h('div', { class: 'actions', style: 'opacity:1' },
        h('button', { onclick: () => createNode(n.id, 'folder') }, 'New folder'),
        h('button', { onclick: () => createNode(n.id, 'file') }, 'New file'),
        n.stats.answered ? h('button', { class: 'danger', onclick: () => resetAnswers(n.id, n.name) }, 'Reset answers') : null)),
  );
  if (!n.children.length) el.append(h('div', { class: 'list' }, h('div', { class: 'empty' }, 'Empty.')));
  else el.append(h('div', { class: 'list' }, n.children.map(nodeRow)));
  return el;
}

// ----- quiz -----
async function quizView(fileId) {
  const data = await api('GET', `/files/${fileId}/questions`);
  const node = await api('GET', `/nodes/${fileId}`);
  const total = data.questions.length;
  const el = h('div');
  let stats = data.stats;

  const scoreEl = h('div', { class: 'qscore' });
  const summary = h('div', { class: 'summary' });
  const dots = data.questions.map((q, i) =>
    h('a', {
      class: 'dot', href: '#', title: `Question ${i + 1}`,
      onclick: (e) => { e.preventDefault(); document.getElementById(`q${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    }, String(i + 1)),
  );

  const refresh = () => {
    scoreEl.textContent = `${stats.correct} / ${stats.questions} correct · ${stats.answered} answered`;
    summary.replaceChildren();
    if (total && stats.answered === stats.questions) {
      const p = pct(stats.correct, stats.questions);
      summary.append(
        h('b', {}, `${stats.correct} / ${stats.questions} (${p}%)`),
        h('p', { class: 'muted', style: 'margin:4px 0 12px' }, p >= 80 ? 'Solid. Check the dashboard for what to review next.' : 'Review the explanations of the wrong answers, then use "Reset my answer" to try again.'),
        h('a', { class: 'btn', href: '#/dashboard' }, 'Open dashboard'),
      );
    }
  };
  const setStatus = (num, status) => { dots[num - 1].className = 'dot' + (status === 'none' ? '' : ' ' + status); };

  el.append(
    crumbs(node.breadcrumb, node.id),
    h('div', { class: 'pagehead' },
      h('div', {}, h('h1', {}, displayName(node.name)), h('p', { class: 'hintline' }, h('kbd', {}, 'A'), '–', h('kbd', {}, 'D'), ' choose  ·  ', h('kbd', {}, 'Enter'), ' submit  ·  ', h('kbd', {}, 'H'), ' hint')),
      h('div', { class: 'actions', style: 'opacity:1' },
        h('a', { class: 'btn', href: `#/file/${fileId}/edit` }, 'Edit questions'),
        h('button', { class: 'danger', onclick: () => resetAnswers(fileId, node.name) }, 'Reset answers'))),
  );
  if (!total) {
    el.append(h('div', { class: 'list' }, h('div', { class: 'empty' }, 'No questions in this file yet. Use "Edit questions" to add some.')));
    return el;
  }
  el.append(h('div', { class: 'qbar' }, h('div', { class: 'dots' }, dots), scoreEl));

  const cards = data.questions.map((q, i) =>
    questionCard(q, i + 1, total, (s) => { stats = s; refresh(); }, setStatus),
  );
  cards.forEach((c) => el.append(c));
  el.append(summary);
  refresh();

  // keyboard: acts on the first unanswered question that is on screen
  el._mount = () => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const ctl = cards.map((c) => c.ctl).find((c) => !c.locked() && c.el.getBoundingClientRect().bottom > 140);
      if (!ctl) return;
      if ('abcd'.includes(k) && k.length === 1) ctl.pick(k.toUpperCase());
      else if ('1234'.includes(k) && k.length === 1) ctl.pick('ABCD'[Number(k) - 1]);
      else if (k === 'Enter' && !e.target.closest('button, a, [role=button]')) ctl.submit();
      else if (k === 'h') ctl.hint();
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  };
  return el;
}

function questionCard(q, num, total, onStats, onStatus) {
  const card = h('div', { class: 'card', id: `q${num}` });
  const st = {
    selected: q.latest?.selected ?? null,
    result: q.latest ? { is_correct: !!q.latest.is_correct, correct: q.correct, explanation: q.explanation } : null,
    hints: [], // revealed hint texts
    hintCount: q.hint_count,
    hintsUsed: q.latest?.hints_used ?? 0,
  };
  // Markdown/Mermaid is rendered once and the same DOM nodes are re-used on every redraw,
  // so choosing an option never re-renders (or flickers) a diagram.
  const qMd = md(q.question);
  const optMd = Object.fromEntries(['A', 'B', 'C', 'D'].map((L) => [L, md(q.options[L])]));
  const hintMd = [];
  let expMd = null;

  const pick = (L) => {
    if (st.result) return;
    st.selected = L;
    draw();
  };

  function draw() {
    const locked = !!st.result;
    const status = locked ? (st.result.is_correct ? 'correct' : 'wrong') : 'none';
    card.className = 'card' + (locked ? ` locked s-${status}` : '');
    onStatus(num, status);
    card.replaceChildren(h('div', { class: 'qhead' }, `Question ${num} of ${total}`), qMd);

    const opts = h('div');
    for (const L of ['A', 'B', 'C', 'D']) {
      let cls = 'opt';
      let badge = L;
      if (locked) {
        if (L === st.result.correct) { cls += ' correct'; badge = '✓'; }
        else if (L === st.selected) { cls += ' wrong'; badge = '✕'; }
      } else if (L === st.selected) cls += ' selected';
      opts.append(
        h('div', {
          class: cls, role: 'button', tabindex: 0, onclick: () => pick(L),
          onkeydown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(L)),
        }, h('span', { class: 'letter' }, badge), optMd[L]),
      );
    }
    card.append(opts);

    if (!locked) {
      st.hints.forEach((t, i) => card.append(h('div', { class: 'hint' }, h('b', {}, `Hint ${i + 1}: `), hintMd[i])));
      const bar = h('div', { class: 'toolbar' });
      bar.append(h('button', { class: 'primary', disabled: !st.selected, onclick: submit }, 'Submit'));
      if (st.hints.length < st.hintCount) {
        bar.append(h('button', { onclick: showHint }, `Show hint (${st.hints.length + 1}/${st.hintCount})`));
      }
      card.append(bar);
    } else {
      const ok = st.result.is_correct;
      if (!expMd && st.result.explanation) expMd = md(st.result.explanation);
      card.append(
        h('div', { class: 'explain' },
          h('div', { class: 'verdict ' + (ok ? 'ok' : 'bad') }, ok ? 'Correct' : `Incorrect — the answer is ${st.result.correct}`),
          expMd,
          h('div', { class: 'small', style: 'margin-top:10px' },
            h('button', { class: 'link', onclick: resetThis }, 'Reset my answer'),
            st.hintsUsed ? h('span', { class: 'muted' }, ` · ${st.hintsUsed} hint(s) used`) : null)),
      );
    }
    if (card.error) card.append(errBox(card.error));
  }

  async function guard(fn) {
    card.error = null;
    try {
      await fn();
    } catch (e) {
      card.error = e;
    }
    draw();
  }
  const showHint = () =>
    guard(async () => {
      const n = st.hints.length + 1;
      const r = await api('GET', `/questions/${q.id}/hints/${n}`);
      st.hints.push(r.content);
      hintMd.push(md(r.content));
    });
  const submit = () =>
    guard(async () => {
      const r = await api('POST', `/questions/${q.id}/answers`, { selected: st.selected, hints_used: st.hints.length });
      st.result = r;
      st.hintsUsed = st.hints.length;
      onStats(r.file_stats);
    });
  const resetThis = () =>
    guard(async () => {
      await api('DELETE', `/questions/${q.id}/answers`);
      const stats = (await api('GET', `/nodes/${q.file_id}`)).stats;
      st.result = null;
      st.selected = null;
      st.hints = [];
      hintMd.length = 0;
      st.hintsUsed = 0;
      expMd = null;
      onStats(stats);
    });

  card.ctl = {
    el: card,
    locked: () => !!st.result,
    pick,
    submit: () => st.selected && !st.result && submit(),
    hint: () => !st.result && st.hints.length < st.hintCount && showHint(),
  };
  draw();
  return card;
}

// ----- editor -----
const emptyQ = () => ({ question: '', options: { A: '', B: '', C: '', D: '' }, correct: 'A', explanation: '', hints: [] });

function mdField(label, value, rows = 3) {
  const ta = h('textarea', { rows, value });
  const prev = h('div', { class: 'preview md' });
  let t;
  const update = () => {
    clearTimeout(t);
    t = setTimeout(() => (ta.value.trim() ? renderMarkdown(prev, ta.value) : (prev.textContent = '')), 250);
  };
  ta.addEventListener('input', update);
  if (value) renderMarkdown(prev, value);
  const el = h('div', { class: 'field' }, label ? h('label', {}, label) : null, h('div', { class: 'pair' }, ta, prev));
  return { el, get: () => ta.value };
}

function questionForm(q, fileId, onSaved, onCancel) {
  const fQ = mdField('Question (Markdown, ```mermaid fences supported)', q.question, 5);
  const fOpt = {};
  const correct = { v: q.correct };
  const optEls = ['A', 'B', 'C', 'D'].map((L) => {
    fOpt[L] = mdField(null, q.options[L], 2);
    const radio = h('input', { type: 'radio', name: 'correct', checked: correct.v === L, onchange: () => (correct.v = L) });
    return h('div', { class: 'field' }, h('label', {}, `Option ${L}  `, h('span', { class: 'correct-pick' }, radio, ' correct')), fOpt[L].el);
  });
  const fExp = mdField('Explanation', q.explanation, 3);

  const hintFields = [];
  const hintBox = h('div');
  const addHint = (text = '') => {
    const f = mdField(null, text, 2);
    const row = h('div', { class: 'hintrow' }, f.el);
    const entry = { f, row };
    row.append(
      h('button', { class: 'danger', onclick: () => { hintFields.splice(hintFields.indexOf(entry), 1); row.remove(); relabel(); } }, 'Remove'),
    );
    hintFields.push(entry);
    hintBox.append(row);
    relabel();
  };
  const relabel = () => hintFields.forEach((e, i) => (e.row.dataset.n = i + 1));
  q.hints.forEach((t) => addHint(t));

  const errSlot = h('div');
  const save = async () => {
    errSlot.replaceChildren();
    const body = {
      question: fQ.get(),
      options: Object.fromEntries(Object.entries(fOpt).map(([L, f]) => [L, f.get()])),
      correct: correct.v,
      explanation: fExp.get(),
      hints: hintFields.map((e) => e.f.get()).filter((t) => t.trim()),
    };
    try {
      if (q.id) await api('PUT', `/questions/${q.id}`, body);
      else await api('POST', `/files/${fileId}/questions`, body);
      onSaved();
    } catch (e) {
      errSlot.append(errBox(e));
    }
  };

  return h(
    'div',
    { class: 'form' },
    h('h2', { style: 'margin-top:0' }, q.id ? `Edit question #${q.id}` : 'New question'),
    fQ.el,
    optEls,
    fExp.el,
    h('div', { class: 'field' }, h('label', {}, 'Hints (optional, vague to specific)'), hintBox, h('button', { onclick: () => addHint() }, 'Add hint')),
    errSlot,
    h('div', { class: 'toolbar' }, h('button', { class: 'primary', onclick: save }, 'Save'), h('button', { onclick: onCancel }, 'Cancel')),
  );
}

async function editView(fileId) {
  const data = await api('GET', `/files/${fileId}/questions?mode=edit`);
  const node = await api('GET', `/nodes/${fileId}`);
  const el = h('div');
  const formSlot = h('div');
  const list = h('div', { class: 'list' });
  let qs = data.questions;

  const reload = () => route();
  const openForm = (q) => {
    formSlot.replaceChildren(questionForm(q, fileId, reload, () => formSlot.replaceChildren()));
    formSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    try {
      for (const [idx, q] of qs.entries()) if (q.position !== idx) await api('PATCH', `/questions/${q.id}`, { position: idx });
    } catch (e) {
      alert(e.message);
    }
    reload();
  };
  const del = async (q) => {
    if (!confirm(`Delete question #${q.id} and its answers?`)) return;
    try {
      await api('DELETE', `/questions/${q.id}`);
    } catch (e) {
      alert(e.message);
    }
    reload();
  };

  qs.forEach((q, i) => {
    const firstLine = q.question.split('\n').find((l) => l.trim() && !l.startsWith('```')) ?? q.question;
    list.append(
      h(
        'div',
        { class: 'row' },
        h('span', { class: 'kind' }, `#${i + 1}`),
        h('div', { class: 'name' }, firstLine.slice(0, 140), h('div', { class: 'muted small' }, `answer ${q.correct} · ${q.hints.length} hint(s)`)),
        h(
          'div',
          { class: 'actions' },
          h('button', { disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
          h('button', { disabled: i === qs.length - 1, onclick: () => move(i, 1) }, '↓'),
          h('button', { onclick: () => openForm(q) }, 'Edit'),
          h('button', { class: 'danger', onclick: () => del(q) }, 'Delete'),
        ),
      ),
    );
  });

  // bulk JSON import
  const jsonTa = h('textarea', { rows: 8, placeholder: '{ "questions": [ { "question": "...", "options": {"A":"..","B":"..","C":"..","D":".."}, "correct": "B", "explanation": "...", "hints": ["..."] } ] }' });
  const replaceBox = h('input', { type: 'checkbox' });
  const bulkErr = h('div');
  const bulk = h(
    'details',
    {},
    h('summary', {}, 'Bulk import from JSON'),
    jsonTa,
    h('div', { class: 'toolbar' },
      h('label', {}, replaceBox, ' replace existing questions in this file'),
      h('button', { onclick: async () => {
        bulkErr.replaceChildren();
        try {
          let body = JSON.parse(jsonTa.value);
          if (Array.isArray(body)) body = { questions: body };
          if (replaceBox.checked) {
            if (!confirm('Replace deletes ALL existing questions (and their answers) in this file. Continue?')) return;
            body.replace = true;
          }
          await api('POST', `/files/${fileId}/questions/bulk`, body);
          reload();
        } catch (e) { bulkErr.append(errBox(e)); }
      } }, 'Import')),
    bulkErr,
  );

  el.append(
    crumbs(node.breadcrumb, node.id),
    h('h1', {}, `Edit: ${node.name}`),
    h('div', { class: 'toolbar' },
      h('button', { class: 'primary', onclick: () => openForm(emptyQ()) }, 'New question'),
      h('a', { class: 'btn', href: `#/file/${fileId}` }, 'Back to quiz')),
    formSlot,
    qs.length ? list : h('p', { class: 'muted' }, 'No questions yet.'),
    bulk,
  );
  return el;
}

// ----- dashboard -----
async function dashboardView() {
  const [s, weak, recent, daily] = await Promise.all([
    api('GET', '/stats'),
    api('GET', '/stats/files?sort=score'),
    api('GET', '/stats/recent?limit=15'),
    api('GET', '/stats/daily?days=30'),
  ]);
  const tile = (v, l) => h('div', { class: 'tile' }, h('b', {}, v), h('span', {}, l));
  const el = h('div', {}, h('h1', {}, 'Dashboard'));
  el.append(
    h('div', { class: 'tiles' },
      tile(s.questions, 'questions'),
      tile(s.answered, 'answered'),
      tile(s.correct, 'correct now'),
      tile(s.accuracy == null ? '—' : s.accuracy + '%', 'accuracy (of answered)'),
      tile(s.attempts, 'total attempts')),
  );

  el.append(h('h2', {}, 'By topic'));
  el.append(
    s.topics.length
      ? table(['Topic', 'Questions', 'Answered', 'Correct', 'Score'], s.topics.map((t) => [
          h('a', { href: `#/node/${t.id}` }, t.name), t.stats.questions, t.stats.answered, t.stats.correct,
          t.stats.questions ? t.stats.score + '%' : '—']), [1, 2, 3, 4])
      : h('p', { class: 'muted' }, 'No data yet.'),
  );

  el.append(h('h2', {}, 'Weakest files (answered first, lowest score first)'));
  const shown = weak.slice(0, 15);
  el.append(
    shown.length
      ? table(['File', 'Correct', 'Last answered'], shown.map((f) => [
          h('a', { href: `#/file/${f.id}`, title: f.path }, f.path.split('/').slice(-1)[0]),
          `${f.correct} / ${f.questions}` + (f.answered < f.questions ? ` (${f.answered} answered)` : ''),
          fmtTime(f.last_answered)]), [1])
      : h('p', { class: 'muted' }, 'No questions yet.'),
  );

  el.append(h('h2', {}, 'Last 30 days'), h('div', { class: 'chartbox' }, chart(daily)));

  el.append(h('h2', {}, 'Recent attempts'));
  el.append(
    recent.length
      ? table(['When', 'File', 'Picked', 'Result'], recent.map((a) => [
          fmtTime(a.answered_at),
          h('a', { href: `#/file/${a.file_id}`, title: a.path }, a.path.split('/').slice(-1)[0]),
          a.selected + (a.hints_used ? ` (${a.hints_used} hint)` : ''),
          a.is_correct ? 'correct' : 'wrong']))
      : h('p', { class: 'muted' }, 'No attempts yet.'),
  );
  return el;
}

function table(head, rows, numCols = []) {
  return h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {}, head.map((t, i) => h('th', { class: numCols.includes(i) ? 'num' : '' }, t)))),
    h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c, i) => h('td', { class: numCols.includes(i) ? 'num' : '' }, c))))));
}

function chart(daily) {
  if (!daily.length) return h('p', { class: 'muted' }, 'No attempts in this period.');
  const W = 840, H = 120, pad = 18, max = Math.max(...daily.map((d) => d.attempts));
  const bw = Math.min(28, (W - pad) / daily.length - 4);
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H + pad}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Attempts per day');
  const add = (name, attrs, text) => {
    const n = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text) n.textContent = text;
    svg.append(n);
    return n;
  };
  daily.forEach((d, i) => {
    const x = 4 + i * (bw + 4);
    const hAll = (d.attempts / max) * H, hOk = (d.correct / max) * H;
    add('rect', { x, y: H - hAll, width: bw, height: hAll, class: 'bad' }).append(Object.assign(document.createElementNS(ns, 'title'), { textContent: `${d.day}: ${d.correct}/${d.attempts} correct` }));
    add('rect', { x, y: H - hOk, width: bw, height: hOk });
    if (daily.length <= 15 || i % 5 === 0) add('text', { x: x + bw / 2, y: H + 12, 'text-anchor': 'middle' }, d.day.slice(5));
  });
  return svg;
}

// ---------- router ----------
const routes = [
  [/^#\/?$/, homeView],
  [/^#\/dashboard$/, dashboardView],
  [/^#\/node\/(\d+)$/, nodeView],
  [/^#\/file\/(\d+)$/, quizView],
  [/^#\/file\/(\d+)\/edit$/, editView],
];
let navToken = 0;
let unmount = null;
async function route() {
  const token = ++navToken;
  const hash = location.hash || '#/';
  document.querySelectorAll('.top a:not(.brand)').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === hash));
  for (const [re, view] of routes) {
    const m = re.exec(hash);
    if (!m) continue;
    try {
      const el = await view(...m.slice(1));
      if (el && token === navToken) {
        unmount?.();
        app.replaceChildren(el);
        unmount = el._mount?.() ?? null;
        window.scrollTo(0, 0);
      }
    } catch (e) {
      if (token === navToken) app.replaceChildren(errBox(e));
    }
    return;
  }
  app.replaceChildren(h('p', { class: 'muted' }, 'Not found. ', h('a', { href: '#/' }, 'Go to topics')));
}
window.addEventListener('hashchange', route);
route();
