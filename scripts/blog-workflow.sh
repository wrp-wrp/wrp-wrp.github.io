#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_BRANCH="master"

log() {
  printf '[blog] %s\n' "$*"
}

die() {
  printf '[blog][error] %s\n' "$*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

usage() {
  cat <<'EOF'
Usage:
  scripts/blog-workflow.sh init
  scripts/blog-workflow.sh doctor
  scripts/blog-workflow.sh new <slug>
  scripts/blog-workflow.sh serve
  scripts/blog-workflow.sh build [--to-docs]
  scripts/blog-workflow.sh build-search
  scripts/blog-workflow.sh publish [-m "commit message"] [-b branch] [--skip-build] [--allow-other-branch]
  scripts/blog-workflow.sh stats
  scripts/blog-workflow.sh dashboard
  scripts/blog-workflow.sh drafts
  scripts/blog-workflow.sh inbox [text...]
  scripts/blog-workflow.sh images [--prune]
  scripts/blog-workflow.sh hide <slug>           Set hidden = true on the post.
  scripts/blog-workflow.sh unhide <slug>         Set hidden = false.
  scripts/blog-workflow.sh draftify <slug>       Set draft = true.
  scripts/blog-workflow.sh publish-flag <slug>   Set draft = false (don't push)

Commands:
  init           Initialize git submodules (theme, etc.)
  doctor         Check local prerequisites and repo state
  new            Create a new post at content/posts/<slug>/index.md
  serve          Run local dev server (no drafts by default; matches live site).
                 Pass --drafts / --future / --all to include them.
  build          Build static files (default: ./public, optional: ./docs)
  build-search   Build site + run pagefind to generate search index in public/pagefind/
  publish        Build, commit, and push. GitHub Actions deploys automatically on push
  stats          Regenerate tools/data.js (post stats, tag counts, inbox)
  dashboard      Regenerate stats and open tools/dashboard.html in default browser
  drafts         List posts with draft = true (paths + word counts)
  inbox          With text: append "- [ ] text" to inbox.md. Without: print inbox.
  images         Find images inside content/posts/* not referenced by any markdown.
                 Add --prune to delete unreferenced images (asks for confirmation).

Examples:
  scripts/blog-workflow.sh new anns-notes
  scripts/blog-workflow.sh inbox "write a note on streaming HNSW recall"
  scripts/blog-workflow.sh dashboard
  scripts/blog-workflow.sh build-search
  scripts/blog-workflow.sh publish -m "blog: add anns notes"
EOF
}

to_repo_root() {
  cd "${REPO_ROOT}"
}

run_init() {
  need_cmd git
  to_repo_root
  git submodule update --init --recursive
  log "Submodules initialized."
}

run_doctor() {
  need_cmd git
  to_repo_root
  if command -v hugo >/dev/null 2>&1; then
    log "Hugo: $(hugo version)"
  else
    die "Hugo is not installed. Install Hugo Extended first."
  fi

  if [[ -f ".github/workflows/hugo.yml" ]]; then
    log "Deploy workflow exists: .github/workflows/hugo.yml"
  else
    die "Missing deploy workflow: .github/workflows/hugo.yml"
  fi

  if [[ -d "themes/typo" ]]; then
    log "Theme found: themes/typo"
  else
    log "Theme folder missing. Run: scripts/blog-workflow.sh init"
  fi

  log "Current branch: $(git rev-parse --abbrev-ref HEAD)"
}

run_new() {
  need_cmd hugo
  to_repo_root
  local slug="${1:-}"
  [[ -n "${slug}" ]] || die "Missing slug. Example: scripts/blog-workflow.sh new anns-notes"
  hugo new "posts/${slug}/index.md"
  local file="content/posts/${slug}/index.md"
  log "Created post: ${file}"

  # Auto-open in preferred editor.
  # Override via BLOG_EDITOR env var (e.g. BLOG_EDITOR='open -a "iA Writer"').
  if [[ -n "${BLOG_EDITOR:-}" ]]; then
    eval "${BLOG_EDITOR} \"${file}\"" \
      && log "Opened with BLOG_EDITOR." \
      || log "(BLOG_EDITOR command failed.)"
  elif command -v open >/dev/null 2>&1; then
    for app in "Typora" "iA Writer" "Obsidian" "MacDown" "MWeb"; do
      if open -a "${app}" "${file}" 2>/dev/null; then
        log "Opened in ${app}."
        return 0
      fi
    done
    log "(No supported markdown editor found. Set BLOG_EDITOR to override, e.g.\n      BLOG_EDITOR='open -a \"iA Writer\"' )"
  fi
}

run_serve() {
  need_cmd hugo
  to_repo_root
  local args=""
  while (($#)); do
    case "$1" in
      --drafts|-D) args="${args} -D" ;;
      --future|-F) args="${args} -F" ;;
      --all)       args="${args} -D -F" ;;
      *) die "Unknown serve option: $1 (try --drafts / --future / --all)" ;;
    esac
    shift
  done
  if [[ -z "${args}" ]]; then
    log "Starting hugo server (drafts OFF — pass --drafts to include)"
  else
    log "Starting hugo server with flags:${args}"
  fi
  # shellcheck disable=SC2086
  hugo server ${args}
}

run_build() {
  need_cmd hugo
  to_repo_root
  local to_docs=0

  while (($#)); do
    case "$1" in
      --to-docs)
        to_docs=1
        ;;
      *)
        die "Unknown build option: $1"
        ;;
    esac
    shift
  done

  if [[ "${to_docs}" -eq 1 ]]; then
    hugo --minify -d docs
    log "Build output: docs/"
  else
    hugo --minify
    log "Build output: public/"
  fi
}

run_publish() {
  need_cmd git
  need_cmd hugo
  to_repo_root

  local message=""
  local branch="${DEFAULT_BRANCH}"
  local skip_build=0
  local allow_other_branch=0

  while (($#)); do
    case "$1" in
      -m|--message)
        shift
        [[ $# -gt 0 ]] || die "Missing value for $1"
        message="$1"
        ;;
      -b|--branch)
        shift
        [[ $# -gt 0 ]] || die "Missing value for $1"
        branch="$1"
        ;;
      --skip-build)
        skip_build=1
        ;;
      --allow-other-branch)
        allow_other_branch=1
        ;;
      *)
        die "Unknown publish option: $1"
        ;;
    esac
    shift
  done

  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD)"

  if [[ "${current_branch}" != "${branch}" && "${allow_other_branch}" -ne 1 ]]; then
    die "Current branch is '${current_branch}', expected '${branch}'. Use -b ${current_branch} or --allow-other-branch."
  fi

  if [[ "${skip_build}" -ne 1 ]]; then
    run_build
  fi

  git add -A
  if git diff --cached --quiet; then
    log "No changes to commit."
    return 0
  fi

  if [[ -z "${message}" ]]; then
    message="blog: publish $(date '+%Y-%m-%d %H:%M')"
  fi

  git commit -m "${message}"
  git push origin "${current_branch}"
  log "Push completed. GitHub Actions will deploy the site."
}

run_stats() {
  to_repo_root
  bash "${SCRIPT_DIR}/stats.sh"
}

run_dashboard() {
  to_repo_root
  run_stats
  local target="${REPO_ROOT}/tools/dashboard.html"
  if [[ ! -f "${target}" ]]; then
    die "Missing tools/dashboard.html. Re-pull the repo or restore from git."
  fi
  log "Opening dashboard: ${target}"
  if command -v open >/dev/null 2>&1; then
    open "${target}"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${target}"
  else
    log "Open manually: ${target}"
  fi
}

run_drafts() {
  to_repo_root
  python3 - "$REPO_ROOT" <<'PY'
import os, re, sys
root = sys.argv[1]
posts = os.path.join(root, "content", "posts")
FRONT = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+\s*", re.S)
def is_draft(text):
    m = FRONT.match(text)
    if not m:
        return False, ""
    fm = m.group(1)
    title = ""
    draft = False
    for line in fm.splitlines():
        if "=" not in line:
            continue
        k, v = [x.strip() for x in line.split("=", 1)]
        if k == "draft" and v.lower() == "true":
            draft = True
        if k == "title":
            title = v.strip("'\"")
    return draft, title
def words(body):
    cjk = len(re.findall(r"[一-鿿]", body))
    en = len(re.findall(r"[A-Za-z0-9_]+", body))
    return cjk + en
out = []
if os.path.isdir(posts):
    for slug in sorted(os.listdir(posts)):
        p = os.path.join(posts, slug)
        idx = os.path.join(p, "index.md")
        md = idx if os.path.isfile(idx) else (p if p.endswith(".md") and os.path.isfile(p) else None)
        if not md:
            continue
        with open(md, encoding="utf-8", errors="ignore") as f:
            txt = f.read()
        d, t = is_draft(txt)
        if d:
            body = FRONT.sub("", txt, count=1)
            out.append((slug, t or slug, words(body), os.path.relpath(md, root)))

if not out:
    print("[blog] No drafts. ✓ Nothing in flight.")
else:
    print(f"[blog] {len(out)} draft{'s' if len(out)!=1 else ''}:")
    for slug, title, w, path in out:
        print(f"  · {title!r}  ({w} words)")
        print(f"    {path}")
PY
}

run_inbox() {
  to_repo_root
  local inbox="${REPO_ROOT}/inbox.md"
  if [[ $# -eq 0 ]]; then
    if [[ -f "${inbox}" ]]; then
      cat "${inbox}"
    else
      log "No inbox.md yet. Append a thought with: scripts/blog-workflow.sh inbox \"...\""
    fi
    return 0
  fi
  local text="$*"
  if [[ ! -f "${inbox}" ]]; then
    cat > "${inbox}" <<EOF
# Inbox — quick captures

Newest at top. Mark with - [x] when done.

EOF
  fi
  printf -- "- [ ] %s\n" "${text}" >> "${inbox}"
  log "Captured: ${text}"
}

run_images() {
  to_repo_root
  local prune=0
  while (($#)); do
    case "$1" in
      --prune) prune=1 ;;
      *) die "Unknown images option: $1" ;;
    esac
    shift
  done

  python3 - "${REPO_ROOT}" "${prune}" <<'PY'
import os, re, sys
root, prune = sys.argv[1], sys.argv[2] == "1"
posts = os.path.join(root, "content", "posts")
EXTS = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")
unreferenced = []
total_imgs = 0
if os.path.isdir(posts):
    for slug in sorted(os.listdir(posts)):
        bundle = os.path.join(posts, slug)
        if not os.path.isdir(bundle):
            continue
        idx = os.path.join(bundle, "index.md")
        if not os.path.isfile(idx):
            continue
        with open(idx, encoding="utf-8", errors="ignore") as f:
            md = f.read()
        for fn in os.listdir(bundle):
            if not fn.lower().endswith(EXTS):
                continue
            total_imgs += 1
            # crude: look for the basename anywhere in markdown body
            if fn in md:
                continue
            unreferenced.append((slug, fn, os.path.join(bundle, fn)))
print(f"[blog] scanned {total_imgs} image(s) across post bundles")
if not unreferenced:
    print("[blog] all images referenced. ✓")
    sys.exit(0)
print(f"[blog] {len(unreferenced)} unreferenced image(s):")
for slug, fn, path in unreferenced:
    print(f"  · {slug}/{fn}")
if prune:
    print()
    ans = input("delete all? [y/N] ").strip().lower()
    if ans == "y":
        for _, _, p in unreferenced:
            try:
                os.remove(p)
                print(f"  rm {p}")
            except OSError as e:
                print(f"  fail {p}: {e}")
        print(f"[blog] removed {len(unreferenced)} file(s)")
    else:
        print("[blog] aborted.")
PY
}

run_toggle_flag() {
  # $1 = flag name (draft|hidden), $2 = desired value (true|false), $3 = slug
  local flag="$1" value="$2" slug="${3:-}"
  [[ -n "${slug}" ]] || die "Missing slug. Example: scripts/blog-workflow.sh ${flag} ${slug:-<slug>}"
  to_repo_root
  local target=""
  if [[ -f "content/posts/${slug}/index.md" ]]; then
    target="content/posts/${slug}/index.md"
  elif [[ -f "content/posts/${slug}.md" ]]; then
    target="content/posts/${slug}.md"
  else
    die "No post found for slug: ${slug}"
  fi
  python3 - "$target" "$flag" "$value" <<'PY'
import sys, re, pathlib
path, flag, value = sys.argv[1], sys.argv[2], sys.argv[3]
p = pathlib.Path(path)
text = p.read_text(encoding="utf-8")
m = re.match(r"^(\+\+\+\s*\n)(.*?)(\n\+\+\+\s*\n)", text, re.S)
if not m:
    sys.exit(f"[error] no TOML frontmatter in {path}")
fm = m.group(2)
line_re = re.compile(rf"^{flag}\s*=.*$", re.M)
new_line = f"{flag} = {value.lower()}"
if line_re.search(fm):
    new_fm = line_re.sub(new_line, fm)
else:
    # insert after draft line if present, else at top of fm
    insert_re = re.compile(r"^draft\s*=.*$", re.M)
    if insert_re.search(fm):
        new_fm = insert_re.sub(lambda m: m.group(0) + "\n" + new_line, fm, count=1)
    else:
        new_fm = new_line + "\n" + fm
new_text = m.group(1) + new_fm + m.group(3) + text[m.end():]
p.write_text(new_text, encoding="utf-8")
print(f"[blog] {flag} = {value.lower()}  →  {path}")
PY
}

run_build_search() {
  need_cmd hugo
  to_repo_root
  hugo --minify
  log "Hugo build complete. Running pagefind…"
  if command -v pagefind >/dev/null 2>&1; then
    pagefind --site public
  else
    if command -v npx >/dev/null 2>&1; then
      npx -y pagefind --site public
    else
      die "Missing both 'pagefind' and 'npx'. Install one of them. (npm i -g pagefind)"
    fi
  fi
  log "Search index: public/pagefind/"
}

main() {
  local cmd="${1:-help}"
  shift || true

  case "${cmd}" in
    init)         run_init "$@" ;;
    doctor)       run_doctor "$@" ;;
    new)          run_new "$@" ;;
    serve)        run_serve "$@" ;;
    build)        run_build "$@" ;;
    build-search) run_build_search "$@" ;;
    publish)      run_publish "$@" ;;
    stats)        run_stats "$@" ;;
    dashboard)    run_dashboard "$@" ;;
    drafts)       run_drafts "$@" ;;
    inbox)        run_inbox "$@" ;;
    images)       run_images "$@" ;;
    hide)         run_toggle_flag hidden true   "$@" ;;
    unhide)       run_toggle_flag hidden false  "$@" ;;
    draftify)     run_toggle_flag draft  true   "$@" ;;
    publish-flag) run_toggle_flag draft  false  "$@" ;;
    help|-h|--help) usage ;;
    *)            die "Unknown command: ${cmd}. Try: scripts/blog-workflow.sh help" ;;
  esac
}

main "$@"
