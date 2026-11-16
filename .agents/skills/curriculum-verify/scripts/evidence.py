#!/usr/bin/env python3
r"""Cheap, deterministic evidence tools for the SelfLearn squad.

They replace work that agents used to do by reading whole pages and whole
lessons into their context.

  evidence.py fetch URL [--grep TERM ...] [--context N] [--max-matches N]
      Download a page once (cached 7 days), convert HTML or PDF to text, and
      print only its title, size, cache path, and the lines matching TERM.
      Never prints the whole page. Safe for parallel agents (one file per URL).

  evidence.py quotes LEDGER.md ... [--ids R1.3,R2.7] [--lesson 6_3_1]
      For every ledger row, fetch the URL and check that the verbatim quote is
      on the page. Prints FOUND / PARTIAL / MISSING / FETCH_ERROR and a short
      context window around the match.

  evidence.py lesson LESSON.md --ledger LEDGER.md ... [--quotes] [--max-kb N]
      Mechanical lesson DoD: the 7 section headings in order, header fields,
      Mermaid, quiz <details>, Tier-1 links in section 7, size budget, and the
      evidence tags `<!-- ev: R1.3 R2.7 -->`. Every tag must exist in a ledger
      row whose status is VERIFIED. With --quotes, also checks the quotes of
      every tagged claim. Lists factual lines that carry no tag.

Ledger format: a markdown table whose header contains the columns
ID | Lesson | Atomic claim | URL | Quote | Applies to | Status
(Vietnamese headers "Trích dẫn", "Áp dụng", "Trạng thái" are accepted).
A literal pipe inside a cell is written as \| (standard markdown escape) and
is matched against the page as a plain "|". Never replace it with "/".

Exit code: 0 = no errors, 1 = errors found, 2 = bad usage.
"""
import argparse
import concurrent.futures
import hashlib
import html
import html.parser
import json
import os
import pathlib
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "Mozilla/5.0 (selflearn-evidence/1.0)"
CACHE_DIR = (
    pathlib.Path(os.environ.get("XDG_CACHE_HOME", pathlib.Path.home() / ".cache"))
    / "selflearn-pages"
)
CACHE_TTL = 7 * 24 * 3600
SECTION_TITLES = [f"## {n}." for n in range(1, 8)]
TAG = re.compile(r"<!--\s*ev:\s*([^>]*?)\s*-->")
# Claim ids: R<lesson number>.<n> for lesson research, L<lab number>.<n> for lab research
# (legacy ledgers use R1/R2 per topic). Distinct prefixes keep ids unique per topic.
TAG_ID = re.compile(r"\b([RL]\d+\.\d+)\b")
CELL_SPLIT = re.compile(r"(?<!\\)\|")
URL = re.compile(r"https?://[^\s|)>\]`\"']+")
FENCE = re.compile(r"^\s*(```|~~~)")


# ---------------------------------------------------------------- fetching
class _Text(html.parser.HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head"}
    BLOCK = {"p", "div", "li", "tr", "br", "h1", "h2", "h3", "h4", "h5", "h6",
             "pre", "section", "article", "table", "dt", "dd", "blockquote"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip, self.title, self._in_title = [], 0, "", False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self._in_title = True
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if not self.skip:
            self.parts.append(data)


def _clean_lines(text):
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def fetch(url):
    """Return (text, title, cache_path, error). Text is plain, one block per line."""
    url = url.split("#", 1)[0]
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    path, meta_path = CACHE_DIR / f"{key}.txt", CACHE_DIR / f"{key}.json"
    if path.exists() and meta_path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        return path.read_text(encoding="utf-8"), meta.get("title", ""), path, None
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read()
            ctype = response.headers.get("Content-Type", "")
    except urllib.error.HTTPError as error:
        return "", "", None, f"HTTP {error.code}"
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
        return "", "", None, str(error)
    title = ""
    if body[:5] == b"%PDF-" or "pdf" in ctype:
        try:
            out = subprocess.run(["pdftotext", "-layout", "-", "-"], input=body,
                                 capture_output=True, timeout=60, check=True)
            text = out.stdout.decode("utf-8", "replace")
        except (OSError, subprocess.SubprocessError) as error:
            return "", "", None, f"PDF not converted: {error}"
    elif "html" in ctype or body.lstrip()[:1] == b"<":
        parser = _Text()
        parser.feed(body.decode("utf-8", "replace"))
        text, title = "".join(parser.parts), parser.title.strip()
    else:
        text = body.decode("utf-8", "replace")
    text = _clean_lines(html.unescape(text))
    path.write_text(text, encoding="utf-8")
    meta_path.write_text(json.dumps({"url": url, "title": title, "fetched": time.time()}),
                         encoding="utf-8")
    return text, title, path, None


# ---------------------------------------------------------------- matching
def norm(text):
    text = unicodedata.normalize("NFKC", text)
    text = (text.replace("‘", "'").replace("’", "'").replace("“", '"')
            .replace("”", '"').replace("–", "-").replace("—", "-")
            .replace("`", "").replace("*", ""))
    return re.sub(r"\s+", " ", text).strip().lower()


def match_quote(quote, page_norm):
    """FOUND when every '...'-separated segment is on the page, PARTIAL when most
    6-word shingles are, else MISSING. Returns (status, position)."""
    quote = norm(quote).strip(' "\'')
    segments = [s.strip(' "\'') for s in re.split(r"\.\.\.|…|\[\.\.\.\]", quote)]
    segments = [s for s in segments if len(s) >= 12] or [quote]
    positions = [page_norm.find(s) for s in segments]
    if all(p >= 0 for p in positions):
        return "FOUND", positions[0]
    words = quote.split()
    shingles = [" ".join(words[i:i + 6]) for i in range(max(1, len(words) - 5))]
    hits = [page_norm.find(s) for s in shingles]
    found = [p for p in hits if p >= 0]
    if shingles and len(found) / len(shingles) >= 0.7:
        return "PARTIAL", found[0]
    return "MISSING", -1


def context(page_norm, pos, width=160):
    if pos < 0:
        return ""
    return "…" + page_norm[max(0, pos - width // 2): pos + width] + "…"


# ---------------------------------------------------------------- ledgers
def _cell_map(header):
    keys = {}
    for i, cell in enumerate(header):
        c = cell.strip().lower()
        if c in ("id", "#") and "id" not in keys:
            keys["id"] = i
        elif c.startswith(("lesson", "bài")):
            keys["lesson"] = i
        elif "claim" in c:
            keys["claim"] = i
        elif "url" in c:
            keys["url"] = i
        elif "quote" in c or "trích" in c:
            keys["quote"] = i
        elif "applies" in c or "áp dụng" in c:
            keys["applies"] = i
        elif "status" in c or "trạng thái" in c:
            keys["status"] = i
    return keys


def read_ledgers(paths):
    """Return {claim_id: row}. Rows without an R<n>.<m> id are ignored (legacy)."""
    rows = {}
    for path in paths:
        keys = None
        for number, line in enumerate(pathlib.Path(path).read_text(encoding="utf-8").splitlines(), 1):
            if not line.startswith("|"):
                keys = None if not line.strip() else keys
                continue
            row = line.strip()
            row = row[1:] if row.startswith("|") else row
            row = row[:-1] if row.endswith("|") and not row.endswith("\\|") else row
            cells = [c.strip().replace("\\|", "|") for c in CELL_SPLIT.split(row)]
            if keys is None:
                keys = _cell_map(cells)
                continue
            if set("".join(cells)) <= set(":- "):
                continue
            if "id" not in keys or keys["id"] >= len(cells):
                continue
            cid = cells[keys["id"]]
            if not TAG_ID.fullmatch(cid):
                continue
            get = lambda k: cells[keys[k]] if k in keys and keys[k] < len(cells) else ""
            url = URL.search(get("url"))
            rows[cid] = {
                "id": cid, "file": str(path), "line": number, "lesson": get("lesson"),
                "claim": get("claim"), "url": url.group(0) if url else "",
                "quote": get("quote"), "status": get("status").upper(),
            }
    return rows


def check_quotes(rows):
    """Fetch each URL once (parallel across URLs) and match every quote."""
    urls = sorted({r["url"] for r in rows if r["url"]})
    pages = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for url, result in zip(urls, pool.map(fetch, urls)):
            pages[url] = result
    results = []
    for r in rows:
        if not r["url"]:
            results.append((r, "NO_URL", ""))
            continue
        text, _, _, error = pages[r["url"]]
        if error:
            results.append((r, "FETCH_ERROR", error))
            continue
        page = norm(text)
        status, pos = match_quote(r["quote"], page)
        results.append((r, status, context(page, pos)))
    return results


def print_quote_results(results):
    errors = 0
    for r, status, info in results:
        bad = status in ("MISSING", "FETCH_ERROR", "NO_URL")
        errors += bad
        print(f"{'ERROR' if bad else 'OK   '} {r['id']:7} {status:11} {r['url']}")
        print(f"        claim: {r['claim'][:200]}")
        if info:
            print(f"        page : {info}")
    return errors


# ---------------------------------------------------------------- lesson DoD
def visible(lines):
    fenced = False
    for number, line in enumerate(lines, 1):
        if FENCE.match(line):
            fenced = not fenced
            yield number, line, True
            continue
        yield number, line, fenced


def check_lesson(path, ledger_rows, max_kb, with_quotes):
    errors, warnings = [], []
    text = pathlib.Path(path).read_text(encoding="utf-8")
    lines = text.splitlines()
    size_kb = len(text.encode("utf-8")) / 1024
    # One hard limit only. A soft "target" warning made writers trim the same
    # lesson 5-7 times (one model call per trim), which cost more than it saved.
    if size_kb > max_kb:
        errors.append(f"size {size_kb:.1f} KB is over the {max_kb} KB hard limit: "
                      "remove whole sub-topics or examples in one edit, not sentence by sentence")

    head = "\n".join(lines[:15])
    for field in ("**Trạng thái**",):
        if field not in head:
            errors.append(f"header field {field} missing")

    found = [n for n, l, fenced in visible(lines) if not fenced and l.startswith("## ")]
    positions = []
    for title in SECTION_TITLES:
        hit = next((n for n in found if lines[n - 1].startswith(title)), None)
        if hit is None:
            errors.append(f"section heading '{title} …' missing")
        positions.append(hit)
    real = [p for p in positions if p]
    if real != sorted(real):
        errors.append("sections 1-7 are not in order")

    if "```mermaid" not in text:
        errors.append("no Mermaid diagram")
    quiz = text.count("<details")
    if not 2 <= quiz <= 3:
        warnings.append(f"{quiz} quiz answers in <details>, expected 2-3")
    if positions[6]:
        refs = URL.findall("\n".join(lines[positions[6]:]))
        if len(set(refs)) < 2:
            errors.append("section 7 has fewer than 2 links")

    used = {}
    for n, line, fenced in visible(lines):
        for tag in TAG.findall(line):
            for cid in TAG_ID.findall(tag):
                used.setdefault(cid, n)
    for cid, n in sorted(used.items()):
        row = ledger_rows.get(cid)
        if row is None:
            errors.append(f"line {n}: tag {cid} is not in any ledger given")
        elif row["status"] != "VERIFIED":
            errors.append(f"line {n}: tag {cid} has ledger status {row['status'] or '?'}")

    # factual-looking lines without a tag (numbers, inline code, flags) in sections 1, 3-5
    untagged = []
    zone = set()
    for i, start in enumerate(positions[:5]):
        if start and i != 1:  # skip section 2 (analogies)
            end = next((p for p in positions[i + 1:] if p), len(lines) + 1)
            zone.update(range(start + 1, end))
    block_tagged = False
    for n, line, fenced in visible(lines):
        if n not in zone or not line.strip():
            block_tagged = False if not line.strip() else block_tagged
            continue
        if TAG.search(line):
            # A line that is only a tag covers the block below it (list, table, code);
            # a tag after text covers that line only.
            block_tagged = TAG.sub("", line).strip() == ""
            continue
        if fenced or line.lstrip().startswith(("#", "|", ">", "```")):
            continue
        if re.search(r"`[^`]+`|\b\d{2,}\b|--?[a-z]", line) and not block_tagged:
            untagged.append(n)
    if untagged:
        warnings.append(f"{len(untagged)} factual-looking lines without an ev tag: "
                        + ", ".join(map(str, untagged[:25])) + (" …" if len(untagged) > 25 else ""))

    print(f"Lesson: {path}")
    print(f"  size {size_kb:.1f} KB, {len(used)} evidence tags, quiz {quiz}")
    quote_errors = 0
    if with_quotes and used:
        rows = [ledger_rows[c] for c in sorted(used) if c in ledger_rows]
        quote_errors = print_quote_results(check_quotes(rows))
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    total = len(errors) + quote_errors
    print(f"Result: {total} errors, {len(warnings)} warnings.")
    return 1 if total else 0


# ---------------------------------------------------------------- CLI
def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_fetch = sub.add_parser("fetch", help="fetch a page to the cache and grep it")
    p_fetch.add_argument("url")
    p_fetch.add_argument("--grep", nargs="*", default=[])
    p_fetch.add_argument("--context", type=int, default=1, help="lines around a match")
    p_fetch.add_argument("--max-matches", type=int, default=15)

    p_quotes = sub.add_parser("quotes", help="check ledger quotes against their pages")
    p_quotes.add_argument("ledgers", nargs="+")
    p_quotes.add_argument("--ids", default="", help="comma-separated claim ids")
    p_quotes.add_argument("--lesson", default="", help="only rows for this lesson id")

    p_lesson = sub.add_parser("lesson", help="mechanical lesson DoD and tag check")
    p_lesson.add_argument("lesson")
    p_lesson.add_argument("--ledger", nargs="+", required=True)
    p_lesson.add_argument("--quotes", action="store_true")
    p_lesson.add_argument("--max-kb", type=float, default=24)

    args = parser.parse_args()
    if args.cmd == "fetch":
        text, title, path, error = fetch(args.url)
        if error:
            print(f"FETCH_ERROR {args.url}: {error}")
            return 1
        lines = text.splitlines()
        print(f"URL   : {args.url}\nTitle : {title}\nCache : {path}\nSize  : {len(text)} chars, {len(lines)} lines")
        for term in args.grep:
            low = term.lower()
            hits = [i for i, l in enumerate(lines) if low in l.lower()]
            print(f"\n--- '{term}': {len(hits)} matching lines (showing {min(len(hits), args.max_matches)})")
            for i in hits[: args.max_matches]:
                a, b = max(0, i - args.context), min(len(lines), i + args.context + 1)
                for j in range(a, b):
                    print(f"{j + 1:6}{'>' if j == i else ':'} {lines[j][:400]}")
                print("      ·")
        return 0

    if args.cmd == "quotes":
        rows = read_ledgers(args.ledgers)
        ids = {i.strip() for i in args.ids.split(",") if i.strip()}
        chosen = [r for r in rows.values()
                  if (not ids or r["id"] in ids) and (not args.lesson or args.lesson in r["lesson"])]
        if not chosen:
            print("No ledger rows with ids like R1.3 or L2.4 matched. Check the ID column.")
            return 1
        errors = print_quote_results(check_quotes(chosen))
        print(f"Result: {len(chosen)} rows, {errors} errors.")
        return 1 if errors else 0

    rows = read_ledgers(args.ledger)
    return check_lesson(args.lesson, rows, args.max_kb, args.quotes)


if __name__ == "__main__":
    sys.exit(main())
