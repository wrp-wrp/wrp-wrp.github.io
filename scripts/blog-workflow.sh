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
  scripts/blog-workflow.sh publish [-m "commit message"] [-b branch] [--skip-build] [--allow-other-branch]

Commands:
  init      Initialize git submodules (theme, etc.)
  doctor    Check local prerequisites and repo state
  new       Create a new post at content/posts/<slug>/index.md
  serve     Run local dev server with drafts (http://localhost:1313)
  build     Build static files (default: ./public, optional: ./docs)
  publish   Build, commit, and push. GitHub Actions deploys automatically on push

Examples:
  scripts/blog-workflow.sh new anns-notes
  scripts/blog-workflow.sh serve
  scripts/blog-workflow.sh build --to-docs
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
  log "Created post: content/posts/${slug}/index.md"
}

run_serve() {
  need_cmd hugo
  to_repo_root
  hugo server -D
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

main() {
  local cmd="${1:-help}"
  shift || true

  case "${cmd}" in
    init)
      run_init "$@"
      ;;
    doctor)
      run_doctor "$@"
      ;;
    new)
      run_new "$@"
      ;;
    serve)
      run_serve "$@"
      ;;
    build)
      run_build "$@"
      ;;
    publish)
      run_publish "$@"
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      die "Unknown command: ${cmd}"
      ;;
  esac
}

main "$@"
