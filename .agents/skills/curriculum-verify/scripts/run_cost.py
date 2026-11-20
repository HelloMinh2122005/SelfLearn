#!/usr/bin/env python3
"""Token cost per squad run, per agent role, from Google Antigravity transcripts.

Reads ~/.gemini/antigravity/brain/<conversation>/.system_generated/
  logs/transcript.jsonl   one JSON object per step; model steps carry
                          model, input_tokens, cache_read_tokens, output_tokens
  subagents/<id>.json     child conversation id + subagentDescriptor.typeName

A "run" is a root conversation plus every subagent it started (recursively).
Token counts include cache reads, so they are larger than uncached input alone.

Usage (from the repository root):
  python3 .agents/skills/curriculum-verify/scripts/run_cost.py              # last 3 SelfLearn runs
  python3 .agents/skills/curriculum-verify/scripts/run_cost.py --last 10
  python3 .agents/skills/curriculum-verify/scripts/run_cost.py --root 32917ab7 --lessons 6
"""
import argparse
import collections
import glob
import json
import os
import re

BRAIN = os.path.expanduser("~/.gemini/antigravity/brain")


def conv_stats(cid):
    s = {"calls": 0, "tokens": 0, "cache": 0, "out": 0, "max_ctx": 0,
         "models": collections.Counter(), "first": "", "start": ""}
    path = f"{BRAIN}/{cid}/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(path):
        return s
    with open(path, errors="ignore") as fh:
        for line in fh:
            try:
                d = json.loads(line)
            except ValueError:
                continue
            s["start"] = s["start"] or d.get("created_at", "")
            if not s["first"] and d.get("type") == "USER_INPUT":
                s["first"] = d.get("content", "")
            if "input_tokens" in d:
                inp = d.get("input_tokens") or 0
                cache = d.get("cache_read_tokens") or 0
                s["calls"] += 1
                s["tokens"] += inp + cache
                s["cache"] += cache
                s["out"] += d.get("output_tokens") or 0
                s["max_ctx"] = max(s["max_ctx"], inp + cache)
                s["models"][d.get("model") or "?"] += 1
    return s


def load_tree(workspace):
    children = collections.defaultdict(list)
    role = {}
    in_ws = set()
    for j in glob.glob(f"{BRAIN}/*/.system_generated/subagents/*.json"):
        parent = j.split("/brain/")[1].split("/")[0]
        try:
            d = json.load(open(j))
        except ValueError:
            continue
        cid = d.get("conversationId")
        if not cid:
            continue
        children[parent].append(cid)
        role[cid] = d.get("subagentDescriptor", {}).get("typeName", "?")
        if any(workspace in u for u in d.get("workspaceUris", [])):
            in_ws.add(parent)
    kids = {c for v in children.values() for c in v}
    roots = [p for p in children if p not in kids and p in in_ws]
    return children, role, roots


def walk(cid, children):
    yield cid
    for k in children.get(cid, []):
        yield from walk(k, children)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--last", type=int, default=3, help="number of most recent runs to show")
    ap.add_argument("--root", help="root conversation id (prefix) to show instead of --last")
    ap.add_argument("--lessons", type=int, help="lessons in the run, to print tokens per lesson")
    ap.add_argument("--workspace", default="SelfLearn", help="substring of the workspace URI")
    args = ap.parse_args()

    if not os.path.isdir(BRAIN):
        raise SystemExit(f"No Antigravity transcripts at {BRAIN}")
    children, role, roots = load_tree(args.workspace)
    cache = {}

    def stats(c):
        if c not in cache:
            cache[c] = conv_stats(c)
        return cache[c]

    if args.root:
        roots = [r for r in roots if r.startswith(args.root)]
        if not roots:
            raise SystemExit(f"No run root starting with {args.root}")
    else:
        roots = sorted(roots, key=lambda r: stats(r)["start"])[-args.last:]

    for r in roots:
        rs = stats(r)
        m = re.search(r"RUN:\s*([^\n<]+)", rs["first"])
        tag = m.group(1).strip() if m else rs["first"][:60].replace("\n", " ")
        groups = collections.defaultdict(lambda: {"n": 0, "calls": 0, "tokens": 0, "cache": 0,
                                                   "out": 0, "max_ctx": 0, "models": collections.Counter()})
        for c in walk(r, children):
            s = stats(c)
            name = "teacher (root)" if c == r else re.sub(r"-\d+$", "", role.get(c, "?"))
            g = groups[name]
            g["n"] += 1
            for k in ("calls", "tokens", "cache", "out"):
                g[k] += s[k]
            g["max_ctx"] = max(g["max_ctx"], s["max_ctx"])
            g["models"].update(s["models"])
        total = sum(g["tokens"] for g in groups.values()) or 1
        print(f"\n=== {r[:8]}  {rs['start'][:16]}  RUN={tag!r}  total={total / 1e6:.1f}M tokens (incl. cache)")
        if args.lessons:
            print(f"    per lesson: {total / args.lessons / 1e6:.2f}M")
        print(f"    {'role':15} {'inst':>4} {'calls':>6} {'tokens':>8} {'share':>6} {'cache%':>6} {'out':>7} {'maxCtx':>7}  models")
        for name, g in sorted(groups.items(), key=lambda x: -x[1]["tokens"]):
            models = ", ".join(f"{k}×{v}" for k, v in g["models"].most_common())
            print(f"    {name:15} {g['n']:4} {g['calls']:6} {g['tokens'] / 1e6:7.2f}M {100 * g['tokens'] / total:5.1f}%"
                  f" {100 * g['cache'] / max(g['tokens'], 1):5.0f}% {g['out'] / 1e3:6.0f}K {g['max_ctx'] / 1e3:6.0f}K  {models}")


if __name__ == "__main__":
    main()
