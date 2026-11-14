export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const LETTERS = ['A', 'B', 'C', 'D'];
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

export function parseId(v, label = 'id') {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, `${label} must be a positive integer`);
  return n;
}

export function validateName(name) {
  if (!nonEmpty(name)) throw new HttpError(400, 'name is required');
  if (/[\/\\\0]/.test(name)) throw new HttpError(400, 'name must not contain / or \\');
  return name.trim();
}

/**
 * Accepts the nested shape ({options:{A..D}, hints:[..]}) and the flat shape
 * (option_a..option_d, hint_1, hint_2, ...). Returns only keys that were present.
 */
export function pickQuestionFields(b) {
  if (b === null || typeof b !== 'object' || Array.isArray(b)) throw new HttpError(400, 'JSON object body required');
  const out = {};
  if ('question' in b) out.question = b.question;
  if ('explanation' in b) out.explanation = b.explanation ?? '';
  if ('correct' in b) out.correct = typeof b.correct === 'string' ? b.correct.trim().toUpperCase() : b.correct;
  if ('position' in b) out.position = b.position;

  for (const L of LETTERS) {
    const l = L.toLowerCase();
    const v = b.options?.[L] ?? b.options?.[l] ?? b[`option_${l}`] ?? b[`option_${L}`];
    if (v !== undefined) (out.options ??= {})[L] = v;
  }

  if ('hints' in b) {
    if (b.hints === null) out.hints = [];
    else if (Array.isArray(b.hints)) out.hints = b.hints;
    else throw new HttpError(400, 'hints must be an array of strings');
  } else {
    const flat = Object.keys(b)
      .map((k) => /^hint_(\d+)$/.exec(k))
      .filter(Boolean)
      .map((m) => [Number(m[1]), b[m[0]]])
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .sort((x, y) => x[0] - y[0]);
    if (flat.length || Object.keys(b).some((k) => /^hint_\d+$/.test(k))) out.hints = flat.map(([, v]) => v);
  }
  return out;
}

/** Full validation of a merged question. Returns a clean object. */
export function validateQuestion(q) {
  if (!nonEmpty(q.question)) throw new HttpError(400, 'question is required');
  for (const L of LETTERS) {
    if (!nonEmpty(q.options?.[L])) throw new HttpError(400, `option ${L} is required`);
  }
  if (!LETTERS.includes(q.correct)) throw new HttpError(400, 'correct must be one of A, B, C, D');
  if (typeof (q.explanation ?? '') !== 'string') throw new HttpError(400, 'explanation must be a string');
  const hints = q.hints ?? [];
  if (!Array.isArray(hints) || hints.some((h) => !nonEmpty(h))) {
    throw new HttpError(400, 'hints must be an array of non-empty strings');
  }
  let position;
  if (q.position !== undefined) {
    if (!Number.isInteger(q.position) || q.position < 0) throw new HttpError(400, 'position must be an integer >= 0');
    position = q.position;
  }
  return {
    question: q.question,
    options: { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D },
    correct: q.correct,
    explanation: q.explanation ?? '',
    hints,
    position,
  };
}
