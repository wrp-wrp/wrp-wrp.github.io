# 白色主页、博客与写作工作台

- /：学术个人主页。
- /blog/：独立博客首页，提供正文搜索、分类、标签和 RSS。
- /studio/：Markdown 写作工作台。
- 现有 /posts/.../、/archive/、/tags/、/resume/、/resources/ 地址保持不变。

## 写作

新建空白文章、论文阅读、工程笔记或生活随笔。修改自动保存到当前浏览器；Ctrl/Cmd+S 立即保存。支持编辑、双栏和预览视图，以及 Markdown 导入导出和 JSON 草稿备份。

草稿不会自动跨设备同步；清理浏览器站点数据会删除本地草稿。换设备前请备份。导入支持纯 Markdown 和 Hugo TOML (+++) frontmatter，保留未知元数据；YAML 文件需要先转换。

图片目前支持 URL 或原文章相对路径，不包含媒体上传管理器。相对图片应和文章一起提交到 page bundle。公式预览需要 KaTeX CDN；正式文章的公式继续在 Hugo 构建时渲染。

发布时连接一个仅对本仓库有 Contents 读写权限的 GitHub fine-grained token。令牌只保存在页面内存中，刷新即清除。仓库固定为 wrp-wrp/wrp-wrp.github.io，默认分支 master。

提交默认创建仓库草稿；明确勾选“发布为公开文章”才写 draft=false。master 的提交沿用已有 GitHub Actions 发布流程，提交成功不代表部署已完成。

编辑已有文章：填写原目录，选择“读取仓库中的同名文章”。它作为新本地草稿打开，保留原本地稿。提交检查 SHA、分支和路径，版本冲突不会覆盖远程文章。原 /admin/ 入口保留。

## 维护与构建

论文信息在 data/publications.toml；个人主页在 layouts/_default/home.html；样式在 assets/css/journal.css；写作工作台在 layouts/_default/studio.html 和 static/js/studio*.js。

需要 Hugo Extended 0.152.2 或更新版本，测试需要 Node 22 或更新版本。无 npm 安装步骤。

~~~sh
hugo --minify
node --test scripts/studio.test.cjs
hugo server
~~~

Windows 若默认缓存目录不可写，用 --cacheDir 指向仓库内 .hugo-cache 的绝对路径。

先运行 hugo，再运行 node scripts/offline-preview.mjs，可生成 .qa/offline/index.html，供用户在本机浏览器手动查看。离线副本不用于生产部署；未下载的大图片和资源链接回现有线上站点。

## 验证

Hugo 0.152.2 构建通过，34 个页面。9 项 Node 测试通过：中文编码、TOML 导入导出、全部已有文章兼容、路径校验、备份数据隔离、默认草稿、远程冲突拒绝、SHA 更新、旧路由和数学公式输出。

GitHub 写入使用模拟响应测试，没有用真实凭证发布测试文章。本轮环境的 HTTP 预览连接受限，浏览器工具禁止 file://；桌面与移动端视觉以及浏览器端到端交互尚未实测。
