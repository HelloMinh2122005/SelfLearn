// renderMarkdown(el, md): Markdown -> sanitized HTML -> Mermaid diagrams.
(() => {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  marked.use({
    gfm: true,
    renderer: {
      code({ text, lang }) {
        if ((lang || '').trim().split(/\s+/)[0] === 'mermaid') return `<pre class="mermaid">${esc(text)}</pre>\n`;
        return false; // default code block
      },
    },
  });

  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const initMermaid = () =>
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark.matches ? 'dark' : 'default' });
  initMermaid();

  // mermaid.render is not safe to run concurrently -> serialize through a queue
  let queue = Promise.resolve();
  let seq = 0;
  async function drawMermaid(el) {
    const src = el.textContent;
    const id = `mmd-${++seq}`;
    try {
      const { svg } = await mermaid.render(id, src);
      el.innerHTML = svg;
      el.classList.add('mermaid-done');
    } catch (err) {
      document.getElementById(id)?.remove();
      document.getElementById('d' + id)?.remove();
      el.classList.add('mermaid-error');
      el.textContent = `Mermaid error: ${err?.message ?? err}\n\n${src}`;
    }
  }

  window.renderMarkdown = function renderMarkdown(el, md) {
    const html = DOMPurify.sanitize(marked.parse(md ?? '', { async: false }));
    el.innerHTML = html;
    el.classList.add('md');
    const blocks = [...el.querySelectorAll('pre.mermaid')];
    if (!blocks.length) return Promise.resolve();
    queue = queue.then(async () => {
      for (const b of blocks) await drawMermaid(b);
    });
    return queue;
  };
})();
