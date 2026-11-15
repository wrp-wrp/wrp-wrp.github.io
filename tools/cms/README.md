# 写作后台构建

线上 `/admin/` 使用 Sveltia CMS 的 npm 版本，由 Vite 打包到 `public/admin/`。
编辑器、字体、翻译和延迟加载的库由本站提供，避免打开页面时依赖 UNPKG/jsDelivr。
GitHub 登录、读取文章与提交仍然需要连接 GitHub API。

构建顺序：先运行 Hugo，再运行下列命令（Node 22.12 或以上）：

```sh
npm --prefix tools/cms install --no-audit --no-fund
npm --prefix tools/cms run build
```

`static/admin/config.yml` 是唯一的内容配置。构建不会改动它，也不改变文章、登录域名或博客主题。
只运行 Hugo 时仍使用原有 CDN 入口；线上发布流程会以本地打包的入口覆盖它。

依赖版本在 `package.json` 中固定。升级时更新版本，运行完整构建，再检查登录、中文界面、文章编辑、图片上传及草稿恢复。
首次成功安装后，应将生成的 `package-lock.json` 纳入版本控制，并将构建命令切换为 `npm ci`。

验证脚本检查生成文件和配置完整性，不代替真实浏览器里的登录及发布测试。
