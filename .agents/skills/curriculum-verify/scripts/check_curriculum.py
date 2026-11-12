#!/usr/bin/env python3
"""Mechanical release checks for a SelfLearn course folder.

Catches the failures that do not need judgement:
  - broken internal links and heading anchors
  - absolute local paths in markdown links
  - CHECKLIST.md counters that disagree with the real item count
  - rewrites that shrink a tracked file or drop its headings
  - dead external links (with --online)

Usage:
  check_curriculum.py <course-folder> [--online] [--allow-rewrite]

Exit code: 0 = no errors, 1 = errors found, 2 = bad usage.
"""
import argparse
import concurrent.futures
import pathlib
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SHRINK_LIMIT = 0.10
USER_AGENT = "curriculum-link-check/1.0"
HOST_DELAY = 1.0
MAX_RETRIES = 3
MAX_RETRY_WAIT = 30
RETRY_STATUSES = {429, 503}
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


def repository_root(root):
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], cwd=root, capture_output=True, text=True
    )
    return pathlib.Path(result.stdout.strip()) if result.returncode == 0 else None


def headings_of(text):
    found = []
    for _, line in visible_lines(text):
        match = HEADING.match(line)
        if match and 2 <= len(match.group(1)) <= 4:
            found.append(match.group(2))
    return found


def check_rewrites(files, root, report, allow_rewrite):
    repo = repository_root(root)
    if repo is None:
        report.warn(str(root), "not a git repository, rewrite guard skipped")
        return
    for path, text in files.items():
        relative = path.relative_to(repo).as_posix()
        result = subprocess.run(
            ["git", "show", f"HEAD:{relative}"],
            cwd=repo,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if result.returncode != 0:
            report.warn(str(path), "not in git HEAD, so a rewrite cannot be detected or undone")
            continue
        if result.stdout == text:
            continue
        add = report.warn if allow_rewrite else report.error
        before = len([line for line in result.stdout.splitlines() if line.strip()])
        after = len([line for line in text.splitlines() if line.strip()])
        if before and (before - after) / before > SHRINK_LIMIT:
            add(str(path), f"shrank from {before} to {after} non-blank lines")
        current = set(headings_of(text))
        for heading in headings_of(result.stdout):
            if heading not in current:
                add(str(path), f"heading removed or renamed: {heading}")


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


def check_external(external, report):
    by_host = {}
    for url in external:
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


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("course", type=pathlib.Path)
    parser.add_argument("--online", action="store_true", help="also test external links")
    parser.add_argument(
        "--allow-rewrite",
        action="store_true",
        help="report shrink and heading loss as warnings; needs explicit approval from the learner",
    )
    options = parser.parse_args()
    root = options.course.resolve()
    if not root.is_dir():
        print(f"not a folder: {root}", file=sys.stderr)
        return 2

    files = {
        path: path.read_text(encoding="utf-8", errors="replace") for path in markdown_files(root)
    }
    report = Report()
    external = {}
    check_links(files, report, external)
    for path, text in files.items():
        if path.name == "CHECKLIST.md":
            check_checklist(path, text, report)
    check_rewrites(files, root, report, options.allow_rewrite)
    if options.online:
        check_external(external, report)

    for line in report.warnings + report.errors:
        print(line)
    print(
        f"\nChecked {len(files)} files, {len(external)} external links"
        f" ({'tested' if options.online else 'not tested'}):"
        f" {len(report.errors)} errors, {len(report.warnings)} warnings."
    )
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
