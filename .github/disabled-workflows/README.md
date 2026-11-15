# 已停用的博客工作流

2026-11-15 按维护者要求暂停博客 Actions。`hugo.yml` 从 `.github/workflows/` 原样移到此目录，不再由主分支的 push、pull_request 或手动 workflow_dispatch 触发。此变更没有修改 GitHub 账户订阅、付款方式或其他仓库设置。

## 当前状态

- 线上博客继续保留此前成功部署的版本；停用不删除 Pages 站点。
- Markdown、图片和 CMS 提交仍可保存到仓库，但暂时不会发布到线上。
- 加载优化代码已保留；实际构建和发布尚未通过验证。
- 停用工作流不会处理欠款，也不会解除账户可能存在的计费限制。

## 恢复发布

先确认 GitHub 账户的计费/Actions 限制已解除，再把 `hugo.yml` 移回 `.github/workflows/hugo.yml` 并推送。恢复后先检查一次完整构建和部署成功，再恢复日常发布。同步移除根目录 README 和 QUICKSTART 的暂停提示。

切换到 Pages 的“从分支发布”仍会触发 GitHub 管理的 Actions 部署任务，不能视为完全摆脱 Actions 的方案：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
