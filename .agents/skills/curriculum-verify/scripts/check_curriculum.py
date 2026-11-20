#!/usr/bin/env python3
"""Mechanical release checks for a SelfLearn course folder.

Catches the failures that do not need judgement:
  - broken internal links and heading anchors
  - absolute local paths in markdown links
  - CHECKLIST.md counters that disagree with the real item count
  - dead external links (with --online)

Usage:
  check_curriculum.py <course-folder> [--online] [--only FILE ...] [--no-cache]

Exit code: 0 = no errors, 1 = errors found, 2 = bad usage.
"""
import argparse
import concurrent.futures
import json
import os
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "curriculum-link-check/1.0"
HOST_DELAY = 1.0
MAX_RETRIES = 2
MAX_RETRY_WAIT = 10
# 429 is not retried: a rate-limited URL ends as a warning either way, so waiting
# for it only stalls the gate (6 Wikimedia URLs cost ~4.5 minutes per run).
RETRY_STATUSES = {503}
CACHE_TTL = 24 * 3600
CACHE_FILE = (
    pathlib.Path(os.environ.get("XDG_CACHE_HOME", pathlib.Path.home() / ".cache"))
    / "curriculum-link-check.json"
)
SKIP_DIRS = {"node_modules", ".git", ".evidence", "dist", "build"}
GENERIC_PATHS = {"", "/", "/linux/man-pages", "/linux/man-pages/"}

FENCE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE = re.compile(r"`[^`]*`")
LINK = re.compile(r"\]\((?:<([^>]+)>|((?:[^()\s]|\([^()\s]*\))+))")
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
ITEM = re.compile(r"^[-*] \[([ xX])\] ")
DOMAIN_HEADING = re.compile(r"Domain\s+(\d+)\b.*?\((\d+)\s+Items?\)", re.I)
DOMAIN_ROW = re.compile(r"^\|\s*\*\*Domain\s+(\d+)\b.*?\|\s*(\d+)\s+items?\s*\|", re.I)
TOTAL_ROW = re.compile(r"^\|\s*\*\*TOTAL\*\*.*?\*\*(\d+)\s+items?\*\*", re.I)
PROGRESS = re.compile(r"(\d+)\s*/\s*(\d+)`")


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, where, message):
        self.errors.append(f"ERROR {where}: {message}")

    def warn(self, where, message):
        self.warnings.append(f"WARN  {where}: {message}")


def visible_lines(text):
    """Yield (line number, line) for lines outside fenced code blocks."""
    fenced = False
    for number, line in enumerate(text.splitlines(), 1):
        if FENCE.match(line):
            fenced = not fenced
            continue
        if not fenced:
            yield number, line


def slug(heading):
    """Approximate GitHub's heading-to-anchor conversion."""
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", heading).strip().lower()
    text = re.sub(r"[^\w\- ]", "", text)
    return text.replace(" ", "-")


def anchors_of(text):
    seen = {}
    anchors = set()
    for _, line in visible_lines(text):
        match = HEADING.match(line)
        if not match:
            continue
        base = slug(match.group(2))
        count = seen.get(base, 0)
        seen[base] = count + 1
        anchors.add(base if count == 0 else f"{base}-{count}")
    return anchors


def links_of(text):
    for number, line in visible_lines(text):
        for match in LINK.finditer(INLINE_CODE.sub("", line)):
            yield number, match.group(1) or match.group(2)


def markdown_files(root):
    for path in sorted(root.rglob("*.md")):
        if not SKIP_DIRS.intersection(path.relative_to(root).parts):
            yield path


def check_links(files, report, external):
    for path, text in files.items():
        for number, target in links_of(text):
            where = f"{path}:{number}"
            if target.startswith(("file:", "/")):
                report.error(where, f"absolute local path: {target}")
                continue
            parsed = urllib.parse.urlsplit(target)
            if parsed.scheme in ("http", "https"):
                external.setdefault(urllib.parse.urldefrag(target).url, where)
                if parsed.path in GENERIC_PATHS:
                    report.warn(where, f"generic homepage citation: {target}")
                continue
            if parsed.scheme:
                continue
            raw_path, _, fragment = target.partition("#")
            destination = path
            if raw_path:
                destination = (path.parent / urllib.parse.unquote(raw_path)).resolve()
                if not destination.exists():
                    report.error(where, f"missing file: {target}")
                    continue
            if fragment and destination.suffix == ".md":
                content = files.get(destination)
                if content is None:
                    content = destination.read_text(encoding="utf-8", errors="replace")
                if urllib.parse.unquote(fragment).lower() not in anchors_of(content):
                    report.error(where, f"missing anchor: {target}")


def check_checklist(path, text, report):
    lines = list(visible_lines(text))
    declared = {}
    actual = {}
    done = {}
    tracker = {}
    total_declared = None
    current = None
    current_level = 0
    total = 0
    total_done = 0
    for number, line in lines:
        heading = HEADING.match(line)
        if heading:
            level = len(heading.group(1))
            domain = DOMAIN_HEADING.search(heading.group(2))
            if domain:
                current = int(domain.group(1))
                current_level = level
                declared[current] = (number, int(domain.group(2)))
                actual.setdefault(current, 0)
                done.setdefault(current, 0)
            elif current is not None and level <= current_level:
                current = None
        row = DOMAIN_ROW.match(line)
        if row:
            progress = PROGRESS.search(line)
            tracker[int(row.group(1))] = (
                number,
                int(row.group(2)),
                int(progress.group(1)) if progress else None,
                int(progress.group(2)) if progress else None,
            )
        total_row = TOTAL_ROW.match(line)
        if total_row:
            total_declared = (number, int(total_row.group(1)))
        item = ITEM.match(line)
        if item:
            total += 1
            is_done = item.group(1) in "xX"
            total_done += is_done
            if current is not None:
                actual[current] += 1
                done[current] += is_done
    for domain, (number, value) in sorted(declared.items()):
        if actual[domain] != value:
            report.error(f"{path}:{number}", f"Domain {domain} heading says {value}, found {actual[domain]} items")
    for domain, (number, value, completed, of) in sorted(tracker.items()):
        if domain not in actual:
            report.error(f"{path}:{number}", f"tracker lists Domain {domain}, which has no section")
            continue
        if value != actual[domain]:
            report.error(f"{path}:{number}", f"Domain {domain} tracker says {value}, found {actual[domain]} items")
        if of is not None and of != actual[domain]:
            report.error(f"{path}:{number}", f"Domain {domain} progress total is {of}, found {actual[domain]} items")
        if completed is not None and completed != done[domain]:
            report.error(f"{path}:{number}", f"Domain {domain} progress says {completed} done, found {done[domain]}")
    if total_declared and total_declared[1] != total:
        report.error(f"{path}:{total_declared[0]}", f"TOTAL says {total_declared[1]}, found {total} items")


def retry_delay(error, attempt):
    header = error.headers.get("Retry-After", "") if error.headers else ""
    wait = int(header) if header.isdigit() else 2 ** (attempt + 2)
    return min(wait, MAX_RETRY_WAIT)


def probe(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(MAX_RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                return url, response.status, None
        except urllib.error.HTTPError as error:
            if error.code not in RETRY_STATUSES or attempt == MAX_RETRIES:
                return url, error.code, None
            time.sleep(retry_delay(error, attempt))
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
            return url, None, str(error)
    return url, None, "retries exhausted"


def probe_host(urls):
    """Probe one host's URLs in sequence so rate limits cannot hide dead links."""
    results = []
    for index, url in enumerate(urls):
        if index:
            time.sleep(HOST_DELAY)
        results.append(probe(url))
    return results


def load_cache():
    try:
        data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    now = time.time()
    return {url: entry for url, entry in data.items() if now - entry.get("checked", 0) < CACHE_TTL}


def save_cache(cache):
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        CACHE_FILE.write_text(json.dumps(cache, indent=0, sort_keys=True), encoding="utf-8")
    except OSError:
        pass


def check_external(external, report, use_cache):
    """Probe external links. Only links that worked are cached, so dead or
    unreachable links are always tested again."""
    cache = load_cache() if use_cache else {}
    by_host = {}
    for url in external:
        if url not in cache:
            by_host.setdefault(urllib.parse.urlsplit(url).netloc, []).append(url)
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for results in pool.map(probe_host, by_host.values()):
            for url, status, problem in results:
                where = external[url]
                if status in (404, 410):
                    report.error(where, f"dead link ({status}): {url}")
                elif status is None:
                    report.warn(where, f"could not reach {url}: {problem}")
                elif status >= 400:
                    report.warn(where, f"HTTP {status}, check by hand: {url}")
                else:
                    cache[url] = {"status": status, "checked": time.time()}
    if use_cache:
        save_cache(cache)
    return len(external) - sum(len(urls) for urls in by_host.values())


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("course", type=pathlib.Path)
    parser.add_argument("--online", action="store_true", help="also test external links")
    parser.add_argument(
        "--only",
        nargs="+",
        type=pathlib.Path,
        metavar="FILE",
        help="check links only in these markdown files; checklist counters still cover the whole course",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help=f"test every external link again instead of trusting results from the last {CACHE_TTL // 3600} hours",
    )
    options = parser.parse_args()
    root = options.course.resolve()
    if not root.is_dir():
        print(f"not a folder: {root}", file=sys.stderr)
        return 2

    files = {
        path: path.read_text(encoding="utf-8", errors="replace") for path in markdown_files(root)
    }
    link_files = files
    if options.only:
        selected = {path.resolve() for path in options.only}
        unknown = [str(path) for path in selected if path not in files]
        if unknown:
            print(f"--only files are not markdown files in {root}: {', '.join(unknown)}", file=sys.stderr)
            return 2
        link_files = {path: files[path] for path in selected}
    report = Report()
    external = {}
    check_links(link_files, report, external)
    for path, text in files.items():
        if path.name == "CHECKLIST.md":
            check_checklist(path, text, report)
    cached = 0
    if options.online:
        cached = check_external(external, report, not options.no_cache)

    for line in report.warnings + report.errors:
        print(line)
    tested = f"tested, {cached} from cache" if options.online else "not tested"
    print(
        f"\nChecked {len(files)} files ({len(link_files)} for links),"
        f" {len(external)} external links ({tested}):"
        f" {len(report.errors)} errors, {len(report.warnings)} warnings."
    )
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
