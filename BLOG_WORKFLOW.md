# 本地写博客并部署上线全流程

本文档对应脚本：`scripts/blog-workflow.sh`。

## 1. 一次性准备

1. 进入仓库根目录：

```bash
cd /Users/rprp/Github-local/wrp-wrp.github.io
```

2. 初始化主题子模块：

```bash
scripts/blog-workflow.sh init
```

3. 检查本地环境与仓库状态：

```bash
scripts/blog-workflow.sh doctor
```

如果 `doctor` 报 `Missing command: hugo`，请先安装 Hugo Extended。

## 2. 日常写作流程（本地）

1. 新建文章：

```bash
scripts/blog-workflow.sh new <slug>
```

示例：

```bash
scripts/blog-workflow.sh new anns-notes
```

文章文件会创建在：`content/posts/<slug>/index.md`。

2. 本地预览（包含草稿）：

```bash
scripts/blog-workflow.sh serve
```

浏览器打开：`http://localhost:1313/`

3. 生产构建（默认输出到 `public/`）：

```bash
scripts/blog-workflow.sh build
```

如果你希望输出到 `docs/`（例如本地检查 Pages 目录结构）：

```bash
scripts/blog-workflow.sh build --to-docs
```

## 3. 一键发布上线

仓库当前部署逻辑：推送到 `master` 分支会触发 GitHub Actions（`.github/workflows/hugo.yml`）并发布到 GitHub Pages。

执行一键发布：

```bash
scripts/blog-workflow.sh publish -m "blog: add new post"
```

`publish` 会自动执行以下步骤：

1. 构建站点（`hugo --minify`）
2. `git add -A`
3. `git commit`
4. `git push origin <当前分支>`

默认要求当前分支是 `master`。如果你明确要从其他分支推送，可使用：

```bash
scripts/blog-workflow.sh publish -b <branch> --allow-other-branch -m "msg"
```

## 4. 常用命令速查

```bash
scripts/blog-workflow.sh help
scripts/blog-workflow.sh init
scripts/blog-workflow.sh doctor
scripts/blog-workflow.sh new <slug>
scripts/blog-workflow.sh serve
scripts/blog-workflow.sh build [--to-docs]
scripts/blog-workflow.sh publish [-m "message"] [-b branch] [--skip-build] [--allow-other-branch]
```

## 5. 推荐实践

1. `slug` 用英文小写加连字符（例如 `wasm-anns-notes`）。
2. 每次发布前先本地 `serve` 看一遍，再执行 `publish`。
3. 如果只想提交不重新构建，可在 `publish` 时加 `--skip-build`。
