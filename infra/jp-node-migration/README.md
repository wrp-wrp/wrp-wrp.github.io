# JP Node Migration Kit

这是一套面向 `jp.ppmister.com` 的可重复迁移工具。它把当前节点的
Nginx、面板、订阅、Xray、Hysteria 2、WireGuard、Fail2ban、UFW、
证书、定时任务和流量数据库打成一个加密归档，并在新的 Debian VPS
上执行两阶段恢复。

## 为什么没有把整台机器 Docker 化

Web 页面和面板可以放进容器，但这台节点最关键的部分依赖宿主机：

- Hysteria 2 占用宿主机 UDP 443；
- WireGuard 需要内核模块、转发与防火墙规则；
- Fail2ban 需要读取宿主机日志并修改防火墙；
- Certbot、Nginx 和 UFW 共同参与 80/443 入口；
- 当前维护脚本直接管理系统服务和实时流量数据库。

把这些组件强行放进 privileged/host-network 容器不会得到真正的隔离，
反而会让排障和跨机器恢复更复杂。因此采用“原生服务 + 加密状态包 +
幂等恢复脚本”的混合方案。

## 安全边界

- Git 中只有脚本和路径清单，没有密码、Token、UUID、私钥或用户订阅。
- 导出使用 AES-256-CBC、PBKDF2-SHA256 和 310000 次迭代。
- 默认交互式输入归档密码；密码不会落盘。
- 自动化时只能通过权限受限的
  `NODE_MIGRATION_PASSPHRASE_FILE` 提供密码。
- 恢复先执行 `--stage-only`，不会修改目标机器。
- 正式恢复前会把目标机器上冲突文件备份到
  `/root/node-migration-pre-restore-时间戳/`。
- 不迁移 SSH 主机密钥和 `authorized_keys`；目标机登录密钥应由 VPS
  控制台预先注入。

## 最短迁移流程

在本机运行：

```bash
cd infra/jp-node-migration

# 1. 从现有 JP 节点生成并下载加密备份
./migrate export jp

# 2. 检查新 VPS，不修改任何文件
./migrate preflight root@新IP

# 3. 上传、解密预检，输入 APPLY 后才正式恢复
./migrate restore root@新IP backups/jp-node-时间戳.enc

# 4. 将 jp.ppmister.com 的 A 记录改到新 IP 后验收
./migrate verify root@新IP jp.ppmister.com
```

导出和恢复时会要求输入同一个归档密码。建议保存到密码管理器，不要使用
代理密码、服务器 root 密码或 SSH 私钥口令。

## 切换顺序

1. 旧服务器保持运行。
2. 导出加密归档。
3. 在新服务器执行 preflight 和 restore。
4. 验证新服务器上的六个服务和五个监听端口。
5. 修改 DNS A 记录。
6. 手机端刷新订阅；使用旧 IP 的 WireGuard 独立配置需要重新导入。
7. 观察至少 24 小时后再关闭旧服务器。

恢复脚本会自动把归档中出现的旧公网 IPv4 替换成新服务器的默认公网
IPv4，并重新生成订阅内容。

## 归档内容

具体路径在 `config/paths.txt` 中，包括：

- `/etc/nginx`、`/var/www` 的节点页面和订阅；
- `/etc/hysteria`、`/usr/local/etc/xray`；
- `/etc/wireguard`、`/etc/wg-server`；
- `/var/lib/wg-traffic` 的一致性 SQLite 快照；
- 面板 API、维护脚本、systemd 单元和 root 定时任务；
- Certbot、Fail2ban、UFW、sysctl 和证书状态。

归档不会包含旧机器的 SSH host key，也不会改动本机 SSH 配置。

## 当前状态

- 迁移工具已同步到 JP 节点的 `/root/jp-node-migration/`。
- JP 节点原有的每日 `wg-snapshot` 因缺少 Git 无法运行；Git 已安装，
  本地加密快照已成功生成，定时任务恢复可用。
- R2 变量目前为空，因此每日快照仍只保存在服务器本机。真正的跨机器
  灾备应使用上面的 `./migrate export jp` 下载到本机，或之后单独配置
  R2/GitHub 私有仓库。
- 端到端无破坏演练记录见 `MIGRATION-QA.md`。

## 自动化流水线

JP 已安装 systemd 定时器，每天自动创建、解密验证并保留加密迁移包。
GitHub Actions 流水线会通过一把只能执行备份网关命令的专用 SSH Key
下载密文、验证 SHA-256、执行异地恢复演练，并把密文作为 14 天制品保存。

完整架构、安全限制和维护命令见 `AUTOMATION.md`。
