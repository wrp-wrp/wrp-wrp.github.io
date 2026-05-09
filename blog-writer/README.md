# blog-writer

本地博客写作工具。一个界面完成写作、预览、管理、发布。

## 启动

```bash
cd /Users/rprp/Github-local/wrp-wrp.github.io
./blog-writer/blog-writer
```

浏览器自动打开 `http://127.0.0.1:2929`。

也可以指定站点目录：

```bash
./blog-writer/blog-writer --site-dir /path/to/hugo-site
```

## 界面

```
┌─────────────────────────────────────────────────────────┐
│  blog-writer          [☀] [+ New Post] [Publish] [ ]   │
├─────────┬────────────────────────┬──────────────────────┤
│ Search  │  Title: [untitled    ] │  Preview             │
│         │  [Draft] [Math] [date] │                      │
│ ○ post1 │                        │  (Hugo 渲染结果)      │
│ ○ post2 │  编辑器 (textarea)     │  KaTeX ✓             │
│ ○ post3 │                        │  Mermaid ✓           │
│ ...     │  支持粘贴/拖拽图片      │  gallery ✓           │
├─────────┴────────────────────────┴──────────────────────┤
│  Saved │ 42 words │                          14:32:05   │
└─────────────────────────────────────────────────────────┘
```

- **左栏** — 文章列表，点击切换，搜索过滤
- **中栏** — Markdown 编辑器 + frontmatter 编辑
- **右栏** — Hugo 实时渲染预览（iframe 嵌入 Hugo dev server）
- **底部栏** — 保存状态、字数、时间
- **右上角 ☀/🌙** — 切换亮色/暗色主题

## 写作

### 新建文章

点击 **+ New Post**，输入 slug（如 `my-new-post`），自动生成 `content/posts/my-new-post/index.md`。

### 编辑

- 直接在编辑器中写 Markdown
- 标题、Draft、Math 开关在顶部工具栏
- **自动保存** — 输入后 500ms 自动保存到磁盘
- **Ctrl+S / Cmd+S** — 立即保存并刷新预览

### 插入图片

- **粘贴** — 截图后直接 Ctrl+V，支持多张同时粘贴
- **拖拽** — 把图片文件拖进编辑器

图片自动上传到文章目录（page bundle），并插入 Markdown 引用：

```markdown
![](image-a3f1.png)
![](image-7b2c.png)
```

同名文件会自动加随机后缀避免覆盖。

### 预览

右侧预览栏实时显示 Hugo 渲染结果：

- **KaTeX 数学公式** — `$E=mc^2$` 正确渲染
- **Mermaid 图表** — 自动渲染
- **gallery shortcode** — 图片网格正常显示
- **主题样式** — 与线上一致

编辑器自动保存后预览自动刷新。也可以点击刷新按钮手动刷新。

## 发布

点击 **Publish**：

1. 弹窗显示 git diff 预览
2. 输入 commit message
3. 点击 Publish

自动执行：`git add -A` → `git commit` → `git push` → GitHub Actions 部署到线上。

## 删除文章

选中文章后，点击右上角删除按钮（垃圾桶图标），确认后删除整个文章目录。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S / Cmd+S | 立即保存并刷新预览 |
| Tab | 插入 4 空格缩进 |

## 技术架构

```
blog-writer/
├── main.go              # 入口
├── posts/store.go       # 文章文件操作
├── hugo/manager.go      # Hugo dev server 子进程管理
├── gitops/ops.go        # Git 操作
├── server/router.go     # HTTP API
├── watcher/fsnotify.go  # 文件监听 + WebSocket
└── web/                 # 前端（嵌入二进制文件）
    ├── index.html
    ├── app.js
    └── style.css
```

- Go 单二进制，零依赖
- 前端纯 JS，无 CDN 依赖
- 预览通过 iframe 嵌入 Hugo dev server，shortcode/数学公式/主题样式完美渲染
- 只监听 `127.0.0.1`，不对外暴露

## 命令行参数

```
./blog-writer [选项]

  --site-dir <path>    Hugo 站点根目录（默认当前目录）
  --port <port>        监听端口（默认 2929）
  --no-browser         不自动打开浏览器
```
