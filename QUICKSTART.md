# 写作速查（QUICKSTART）

最常用的 4 条命令，按顺序就够用。所有命令在仓库根目录执行。

> 推荐先把 `bin/` 加到 PATH，这样可以直接 `blog new ...`：
>
> ```bash
> echo 'export PATH="$HOME/Github-local/wrp-wrp.github.io/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```
>
> 下面命令统一用 `blog` 写。也可以用全路径 `scripts/blog-workflow.sh ...`。

## 1. 新建一篇文章

```bash
blog new my-slug
```

文件会创建在 `content/posts/my-slug/index.md`，并**自动用 Typora 打开**（如果装了的话；否则尝试 iA Writer / Obsidian；都没有就不打开）。`slug` 用英文小写 + 连字符。

要换编辑器，设置环境变量：

```bash
export BLOG_EDITOR='open -a "iA Writer"'   # 或 'open -a Obsidian'
```

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
blog publish -m "blog: add my-slug"
```

这一条会做：本地构建 → `git add -A` → `git commit` → `git push origin master`。
推送到 `master` 后，GitHub Actions 会重新构建并发布到 <https://wrp-wrp.github.io/>，约 30 秒。

## 5. 在手机上写（Sveltia CMS）

仓库已经内置了一个网页 admin 面板，部署后访问：

> <https://wrp-wrp.github.io/admin/>

### 首次配置

Sveltia CMS 用 GitHub 直连，第一次打开会要求授权：

1. 在 Safari/Chrome 打开 `/admin/`
2. 点 **Sign in with GitHub**（推荐用 Personal Access Token 方式，最简单）
   - 生成 fine-grained PAT：<https://github.com/settings/tokens?type=beta>
   - 仓库选 `wrp-wrp/wrp-wrp.github.io`，权限给 **Contents: Read and write** + **Metadata: Read**
   - 把 token 粘进 Sveltia
3. 选 "文章" 集合 → "+ New" → 填写表单 → 点 Publish

发布等于一次 commit 推到 `master`，然后 GitHub Actions 自动部署。手机 Safari 里也能用，加到主屏幕（"添加到主屏幕"）就有 PWA 体验。

### 字段说明（CMS 面板里能看到的）

- 标题 / 英文标题（可选）
- 日期（默认当前时间）
- 摘要 / 英文摘要
- 标签、分类
- 启用数学公式 (KaTeX) — 默认开
- 草稿 — 勾上就不部署
- 隐藏 — URL 可访问但不出现在列表
- 正文 — markdown 编辑器，所见即所得

要在手机里上传图片，用面板里的图片按钮即可，会传到 `static/uploads/`。

## 速查表

```bash
blog new <slug>          # 新建文章 + 打开 Typora
blog serve               # 本地预览
blog serve --drafts      # 预览含草稿
blog publish -m "msg"    # 发布上线
blog drafts              # 列出所有 draft = true 的文章
blog inbox "想法"        # 把灵感丢进 inbox.md
blog hide <slug>         # 隐藏一篇文章（不在列表里出现）
blog unhide <slug>       # 取消隐藏
```

手机：直接打开 <https://wrp-wrp.github.io/admin/>。

完整命令见 `blog help`。流程化写作建议见 `WRITING_WORKFLOW.md`。
出问题时看 `MAINTENANCE.md`。
