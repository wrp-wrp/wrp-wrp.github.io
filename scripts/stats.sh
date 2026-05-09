#!/usr/bin/env bash
# Generate dashboard data: scans content/posts and writes tools/data.js
# Usage: scripts/stats.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR="${REPO_ROOT}/tools"
OUT_FILE="${OUT_DIR}/data.js"
INBOX_FILE="${REPO_ROOT}/inbox.md"

mkdir -p "${OUT_DIR}"

python3 - "$REPO_ROOT" "$OUT_FILE" "$INBOX_FILE" <<'PY'
import json, os, re, sys, time, datetime, subprocess

repo_root, out_file, inbox_file = sys.argv[1], sys.argv[2], sys.argv[3]

posts_dir = os.path.join(repo_root, "content", "posts")
posts = []

FRONT_RE = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+\s*", re.S)

def parse_toml_frontmatter(text):
    """very small TOML subset parser for our usage (key = 'value', date, draft, tags, etc.)"""
    m = FRONT_RE.match(text)
    if not m:
        return {}, text
    fm_text = m.group(1)
    body = text[m.end():]
    out = {}
    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        # arrays
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1]
            items = re.findall(r"\"([^\"]*)\"|'([^']*)'", inner)
            arr = [a or b for a, b in items]
            out[key] = arr
            continue
        if val.lower() == "true":
            out[key] = True
            continue
        if val.lower() == "false":
            out[key] = False
            continue
        # quoted string or bareword
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            out[key] = val[1:-1]
        else:
            out[key] = val
    return out, body

def word_count(text):
    # rough: count CJK chars + alpha words
    cjk = len(re.findall(r"[一-鿿]", text))
    en = len(re.findall(r"[A-Za-z0-9_]+", text))
    return cjk + en

if os.path.isdir(posts_dir):
    for entry in sorted(os.listdir(posts_dir)):
        full = os.path.join(posts_dir, entry)
        idx = os.path.join(full, "index.md")
        slug = entry
        if os.path.isdir(full) and os.path.isfile(idx):
            md_path = idx
        elif os.path.isfile(full) and entry.endswith(".md"):
            md_path = full
            slug = entry[:-3]
        else:
            continue

        try:
            with open(md_path, encoding="utf-8") as f:
                txt = f.read()
        except Exception:
            continue
        fm, body = parse_toml_frontmatter(txt)

        date_raw = fm.get("date", "")
        date_str = date_raw[:10] if isinstance(date_raw, str) else ""
        try:
            mtime = os.path.getmtime(md_path)
        except OSError:
            mtime = 0

        # count images in bundle
        img_count = 0
        if md_path.endswith("/index.md"):
            for f in os.listdir(os.path.dirname(md_path)):
                if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")):
                    img_count += 1

        posts.append({
            "slug": slug,
            "path": os.path.relpath(md_path, repo_root),
            "title": fm.get("title", slug),
            "title_en": fm.get("title_en", ""),
            "summary": fm.get("summary", ""),
            "date": date_str,
            "draft": bool(fm.get("draft", False)),
            "hidden": bool(fm.get("hidden", False)),
            "tags": fm.get("tags", []) if isinstance(fm.get("tags", []), list) else [],
            "categories": fm.get("categories", []) if isinstance(fm.get("categories", []), list) else [],
            "wordCount": word_count(body),
            "imageCount": img_count,
            "mtime": mtime,
        })

posts.sort(key=lambda p: p["date"], reverse=True)

# tag counts (exclude draft + hidden — same rule as the rendered site)
tag_counts = {}
for p in posts:
    if p["draft"] or p["hidden"]:
        continue
    for t in p["tags"]:
        tag_counts[t] = tag_counts.get(t, 0) + 1

# month buckets (last 24 months) — published, non-hidden only
month_counts = {}
for p in posts:
    if p["draft"] or p["hidden"] or not p["date"]:
        continue
    ym = p["date"][:7]
    month_counts[ym] = month_counts.get(ym, 0) + 1

months_24 = []
today = datetime.date.today().replace(day=1)
for i in range(23, -1, -1):
    y = today.year
    m = today.month - i
    while m <= 0:
        m += 12
        y -= 1
    months_24.append(f"{y:04d}-{m:02d}")

# inbox lines
inbox_items = []
if os.path.isfile(inbox_file):
    with open(inbox_file, encoding="utf-8") as f:
        for line in f:
            s = line.rstrip("\n")
            stripped = s.strip()
            if not stripped:
                continue
            done = False
            text = None
            if stripped.startswith("- [x]") or stripped.startswith("- [X]"):
                done = True; text = stripped[5:].strip()
            elif stripped.startswith("- [ ]"):
                done = False; text = stripped[5:].strip()
            elif stripped.startswith("- ") and not stripped.startswith("- ["):
                text = stripped[2:].strip()
            else:
                continue  # ignore prose / headings
            inbox_items.append({"text": text, "done": done, "raw": s})

# git status quick
def git_quick():
    try:
        out = subprocess.check_output(
            ["git", "-C", repo_root, "status", "--porcelain"],
            stderr=subprocess.DEVNULL,
        ).decode("utf-8", "ignore")
        changes = [l for l in out.splitlines() if l.strip()]
        return {"dirty": len(changes), "lines": changes[:30]}
    except Exception:
        return {"dirty": 0, "lines": []}

def git_recent():
    try:
        out = subprocess.check_output(
            ["git", "-C", repo_root, "log", "-n", "10", "--pretty=format:%h|%cs|%s"],
            stderr=subprocess.DEVNULL,
        ).decode("utf-8", "ignore")
        commits = []
        for l in out.splitlines():
            parts = l.split("|", 2)
            if len(parts) == 3:
                commits.append({"hash": parts[0], "date": parts[1], "msg": parts[2]})
        return commits
    except Exception:
        return []

data = {
    "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
    "repoRoot": repo_root,
    "posts": posts,
    "totalWords": sum(p["wordCount"] for p in posts if not p["draft"] and not p["hidden"]),
    "totalDraftWords": sum(p["wordCount"] for p in posts if p["draft"]),
    "draftCount": sum(1 for p in posts if p["draft"]),
    "hiddenCount": sum(1 for p in posts if p["hidden"] and not p["draft"]),
    "publishedCount": sum(1 for p in posts if not p["draft"] and not p["hidden"]),
    "listedCount": sum(1 for p in posts if not p["draft"] and not p["hidden"]),
    "tagCounts": tag_counts,
    "months24": months_24,
    "monthCounts": month_counts,
    "inbox": inbox_items,
    "git": git_quick(),
    "recent": git_recent(),
}

with open(out_file, "w", encoding="utf-8") as f:
    f.write("// Auto-generated by scripts/stats.sh — do not edit by hand.\n")
    f.write("window.__BLOG_DATA = ")
    f.write(json.dumps(data, ensure_ascii=False, indent=2))
    f.write(";\n")

print(f"[stats] wrote {out_file}")
print(f"[stats] posts={len(posts)} listed={data['listedCount']} drafts={data['draftCount']} hidden={data['hiddenCount']} tags={len(tag_counts)} words={data['totalWords']}")
PY
