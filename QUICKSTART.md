# 写作速查（QUICKSTART）

最常用的 4 条命令，按顺序就够用。所有命令在仓库根目录执行。

## 1. 新建一篇文章

```bash
scripts/blog-workflow.sh new my-slug
```

文件会创建在 `content/posts/my-slug/index.md`。`slug` 用英文小写 + 连字符。

文章 front matter（`+++ ... +++`）默认长这样：

```toml
+++
date = '2026-05-09T22:00:00+08:00'
draft = false
math = true
title = 'My Slug'
+++
```

可选字段（按需添加）：

| 字段 | 作用 |
|---|---|
| `tags = ["ANNS", "DB"]` | 标签，会出现在首页 Topics |
| `summary = "一句话摘要"` | 列表页/卡片摘要（中文） |
| `summary_en = "..."` | 英文摘要（覆盖 `summary`） |
| `title_en = "..."` | 英文标题（覆盖 `title`） |
| `hidden = true` | 不在首页/列表显示，但 URL 可访问 |
| `draft = true` | 完全不构建，本地 `serve --drafts` 才能看到 |

## 2. 本地预览

```bash
scripts/blog-workflow.sh serve
```

浏览器打开 `http://localhost:1313/`。改 markdown 会自动热重载。

要看草稿/未来日期：

```bash
scripts/blog-workflow.sh serve --drafts      # 含 draft = true
scripts/blog-workflow.sh serve --all         # 含草稿 + 未来日期
```

## 3. 插图片

把图片直接放进文章目录（page bundle）：

```text
content/posts/my-slug/
  index.md
  cover.png
  fig-1.png
```

Markdown 里相对路径引用：

```md
![架构示意](fig-1.png)
```

需要图库（多图网格 + 灯箱）时用 shortcode（详见 `GALLERY_WORKFLOW.md`）：

```md
{{< gallery title="实验截图" columns="3" captions="true" >}}
```

## 4. 一键发布

```bash
scripts/blog-workflow.sh publish -m "blog: add my-slug"
```

这一条会做：本地构建 → `git add -A` → `git commit` → `git push origin master`。
推送到 `master` 后，GitHub Actions 会重新构建并发布到 <https://wrp-wrp.github.io/>，约 30 秒。

## 速查表

```bash
scripts/blog-workflow.sh new <slug>        # 新建文章
scripts/blog-workflow.sh serve             # 本地预览
scripts/blog-workflow.sh serve --drafts    # 预览含草稿
scripts/blog-workflow.sh publish -m "msg"  # 发布上线
scripts/blog-workflow.sh drafts            # 列出所有 draft = true 的文章
scripts/blog-workflow.sh inbox "想法"      # 把灵感丢进 inbox.md
scripts/blog-workflow.sh hide <slug>       # 隐藏一篇文章（不在列表里出现）
scripts/blog-workflow.sh unhide <slug>     # 取消隐藏
```

完整命令见 `scripts/blog-workflow.sh help`。流程化写作建议见 `WRITING_WORKFLOW.md`。
出问题时看 `MAINTENANCE.md`。
