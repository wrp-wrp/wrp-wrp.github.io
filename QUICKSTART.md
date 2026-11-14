# 写作速查（QUICKSTART）

电脑上可以在仓库根目录运行 `./bin/b n my-slug` 新建文章，`./bin/b s` 预览，`./bin/b p "blog: add my-slug"` 发布。手机或浏览器里可以用 [写作后台](https://wrp-wrp.github.io/admin/)。

下面的命令都从仓库根目录运行。第一次在新电脑上使用，请安装 Hugo Extended 并运行 `./bin/blog init` 初始化主题。用 `./bin/b dashboard` 打开写作面板，可查看文章、草稿和灵感箱。

## 1. 新建一篇文章

```bash
./bin/b n my-slug
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
contentLanguage = 'zh-CN'
+++
```

可选字段（按需添加）：

| 字段 | 作用 |
|---|---|
| `tags = ["ANNS", "DB"]` | 标签，会出现在 Tags 页 |
| `contentLanguage = 'zh-CN'` | 中文正文（新文章默认）；英文正文改为 `'en'` |
| `summary = "一句话摘要"` | 与正文同语言的摘要，用于首页和归档 |
| `summary_en = "..."` | 备用英文摘要，不覆盖 `summary` |
| `title_en = "..."` | 备用英文标题，不覆盖 `title` |
| `hidden = true` | 不在首页/列表显示，但 URL 可访问 |
| `draft = true` | 线上站点不渲染，本地用 `./bin/b s --drafts` 预览 |

标题和摘要使用正文的语言。首页混排中英文文章，`/posts/` 的 `All / 中文 / English` 可以筛选正文语言；英文标题或摘要不代表有英文全文。现有文章链接不变。

## 2. 本地预览

```bash
./bin/b s
```

浏览器打开 `http://localhost:1313/`。改 markdown 会自动热重载。

要看草稿/未来日期：

```bash
./bin/b s --drafts      # 含 draft = true
./bin/b s --all         # 含草稿和未来日期
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
./bin/b p "blog: add my-slug"
```

发文前确认 `draft = false`，并用 `git status --short` 看一下待提交的文件。发布命令会构建站点、暂存发布路径内的变动、提交并推送到 `master`。GitHub Actions 随后会部署到 <https://wrp-wrp.github.io/>。

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
- 正文语言 — 默认中文，写英文时选 English
- 日期（默认当前时间）
- 摘要 / 英文摘要
- 标签、分类
- 启用数学公式 (KaTeX) — 默认开
- 草稿 — 勾上后 Hugo 不生成文章页面。后台保存仍会提交到公开 GitHub 仓库，需要私下写的草稿请留在本地。
- 隐藏 — URL 可访问但不出现在列表
- 正文 — markdown 编辑器，所见即所得

在文章里点图片按钮上传，图片会和文章的 `index.md` 放在同一个目录。

## 速查表

```bash
./bin/b n <slug>      # 新建文章并打开编辑器
./bin/b s            # 本地预览
./bin/b s --drafts   # 预览含草稿
./bin/b p "msg"      # 发布上线
./bin/b d            # 列出所有 draft = true 的文章
./bin/b i "想法"     # 记录到 inbox.md
./bin/b dashboard    # 打开本地写作面板
./bin/b hide <slug>  # 从列表隐藏一篇文章
./bin/b unhide <slug>
```

手机：直接打开 <https://wrp-wrp.github.io/admin/>。

完整命令见 `./bin/b full`。流程化写作建议见 `WRITING_WORKFLOW.md`。
出问题时看 `MAINTENANCE.md`。
