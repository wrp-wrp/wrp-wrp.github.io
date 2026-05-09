# 维护手册（MAINTENANCE）

站点出问题时看这里。覆盖：本地环境、构建、部署、常见报错。

## 1. 站点关键信息

| 项 | 值 |
|---|---|
| 上线域名 | <https://wrp-wrp.github.io/> |
| 仓库 | `git@github.com:wrp-wrp/wrp-wrp.github.io.git` |
| 部署分支 | `master`（push 即触发部署） |
| 部署方式 | GitHub Actions → GitHub Pages（`.github/workflows/hugo.yml`） |
| 构建器 | Hugo Extended `0.134.0`（CI 中固定，见 workflow `HUGO_VERSION`） |
| 主题 | `themes/typo`（git submodule） |
| 评论 | giscus（仓库 Discussions） |

构建产物 `public/` 已 gitignore — CI 会重新生成，不要手工 commit。

## 2. 本地环境要求

- Hugo Extended（≥ 0.134.0 即可）
  - macOS: `brew install hugo`
- Git，且初始化过子模块
- Node（仅在本地需要预先生成搜索索引时）

第一次克隆后：

```bash
scripts/blog-workflow.sh init     # git submodule update --init --recursive
scripts/blog-workflow.sh doctor   # 检查 hugo / workflow / theme / 当前分支
```

## 3. 部署链路（出问题先确认在哪一环）

```
本地写 markdown
   │
   │  scripts/blog-workflow.sh publish -m "..."
   ▼
git push origin master
   │
   ▼
GitHub Actions: Deploy Hugo site to Pages
   ├─ Install Hugo 0.134.0
   ├─ checkout (含 submodules)
   ├─ hugo --minify --baseURL https://wrp-wrp.github.io/
   ├─ npx pagefind --site public            ← 生成站内搜索索引
   ├─ upload-pages-artifact (./public)
   └─ deploy-pages
   │
   ▼
https://wrp-wrp.github.io/
```

排错时把链路从下往上排查：先看 Actions 里最近一次 run 是 success / failure，再判断是「构建挂了」还是「部署挂了」。

## 4. 常用排错命令

查看最近 5 次 CI：

```bash
gh run list --limit 5
```

查看某次失败的日志：

```bash
gh run view <run-id> --log-failed | tail -80
```

实时跟踪当前 push 的 run：

```bash
gh run watch
```

本地复现 CI 构建（用相同参数）：

```bash
rm -rf public
hugo --minify --baseURL "https://wrp-wrp.github.io/"
```

## 5. 已知问题与处置

### 5.1 Hugo 模板报 "wrong type for value; expected int; got int64"

- 现象：CI Build with Hugo 步骤失败，错误指向 `layouts/_default/home.html`，行内有 `AddDate` / `seq`。
- 原因：Hugo 较新版本里 `seq` 产出的值是 `int64`，但 `time.Time.AddDate` 要求 `int`。
- 修法：把进入 `AddDate` 的参数都用 `int` 包裹。例如：

  ```go-html-template
  {{ range seq 11 -1 0 }}
      {{ $offset := int . }}
      {{ $month := $now.AddDate 0 (int (mul -1 $offset)) 0 }}
  ```

- 历史：commit `fb83792` 修复过同一处。如果再次撞到，先在本地 `hugo --minify` 复现，再加 `int` 转换。

### 5.2 主题目录是空的 / 构建报 "theme \"typo\" not found"

- 原因：忘了拉子模块。
- 修法：

  ```bash
  scripts/blog-workflow.sh init
  ```

- CI 已经设置 `submodules: recursive`，CI 一般不会撞到这个问题，主要是新机器/新克隆。

### 5.3 推送成功但站点没更新

- 步骤 1：`gh run list --limit 3` 看最新一次 run。
  - 如果是 `failure` → 看 5.1 思路定位模板报错。
  - 如果是 `success` → 等 30~60 秒（CDN 缓存），或硬刷浏览器（⌘⇧R）。
- 步骤 2：确认推的是 `master` 分支。其他分支不会触发部署。

### 5.4 草稿混进了线上

- 现象：本地能看到的 WIP 文章上线了。
- 原因：`scripts/blog-workflow.sh serve` 默认 **不** 含草稿，但 `publish` 走的是 `hugo --minify`，**不会** 跳过 `draft = false` 的文章 — 真正的草稿请显式写 `draft = true`。
- 修法：

  ```bash
  scripts/blog-workflow.sh draftify <slug>     # 标记为 draft = true
  scripts/blog-workflow.sh publish -m "..."    # 重新发布即从线上消失
  ```

- 想"对外可达 URL 但不出现在首页/列表"，用 `hidden = true`，不要用 `draft`。

### 5.5 想紧急把某篇下线

- 软下线（保留文件，不在列表显示，URL 仍可访问）：

  ```bash
  scripts/blog-workflow.sh hide <slug>
  scripts/blog-workflow.sh publish -m "hide: <slug>"
  ```

- 硬下线（彻底从站点消失）：

  ```bash
  scripts/blog-workflow.sh draftify <slug>
  scripts/blog-workflow.sh publish -m "draftify: <slug>"
  ```

### 5.6 站内搜索 (pagefind) 没有结果

- pagefind 索引由 CI 生成（`npx pagefind --site public`），本地默认看不到。
- 想本地预览搜索：

  ```bash
  scripts/blog-workflow.sh build-search
  hugo server --renderToDisk    # 让搜索能命中已写入磁盘的索引
  ```

## 6. 配置改动小贴士

- 站点元信息（标题 / 个人简介 / 社交链接 / 菜单）：`hugo.toml`
- 首页布局：`layouts/_default/home.html`
- 列表/详情/部分组件：`layouts/`、`themes/typo/layouts/`
- 自定义 shortcode（如 `gallery`）：`layouts/shortcodes/`
- 静态资源（直接拷贝到根的文件，例如 `favicon.ico`、`images/`）：`static/`

每改完一处，养成习惯：

```bash
scripts/blog-workflow.sh serve     # 本地确认
scripts/blog-workflow.sh publish -m "feat/fix/style: ..."
```

## 7. 备份与恢复

仓库本身就是全备份。所有内容都在：

- `content/`（文章 + 图片）
- `hugo.toml`、`layouts/`、`assets/`、`static/`（配置 + 模板 + 资源）
- `archetypes/`（新文章模板）

只要这几项 push 过 GitHub，就可以从任意机器 `git clone` + `scripts/blog-workflow.sh init` 完整还原。

## 8. 紧急回滚

如果一次发布把站点搞挂了，又一时定位不到：

```bash
git revert HEAD            # 回滚最近一次提交（保留历史）
git push origin master     # 触发新部署
```

或者回到某个已知好的 commit：

```bash
git revert --no-commit <bad-commit>..HEAD
git commit -m "revert: rollback to <good-commit>"
git push origin master
```

避免 `git reset --hard + push --force`，那会丢历史。
