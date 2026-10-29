# 默认安装：DSH 记忆与人设

> **兼容范围（2026-10-29）**：本方案已验证 DSH **0.2.1-rc.2**。官方 **0.2.2-alpha.2** 涉及工具、提示词和会话接口调整，尚未完成兼容验证；不要将本次记忆插件更新视为宿主升级许可。先保留现用环境，在隔离部署验证新版。见[官方更新说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.2)。新版宿主要求 Node.js 24.9+；下文较低运行时要求只对应旧适配基线。

返回 [README](../README.md)。本页面向Windows PowerShell，无需Codex、OpenAI账户、会话控制插件或工程派工技能。使用你能正常使用的DSH模型服务即可。

## 1. 准备工具和主仓库

需要Git、Node.js 22.19+或24+、npm，以及DSH。若尚未安装DSH，按[官方项目](https://github.com/deepseek-ai/deepseek-harness)准备本版基线：

```powershell
npm install --global @deepseek-ai/dsh@0.2.1-rc.2
node --version
dsh --version
```

已有其他版本时先检查兼容性，不强制替换现用安装。下面的profile和数据目录单独创建，不复制原有登录凭据。

```powershell
git clone https://github.com/XRH66/codex-deepseek-starter.git
Set-Location codex-deepseek-starter
$starter = (Get-Location).Path
npm ci
npm run check
```

已克隆时直接进入仓库，保留 `$starter` 即可。

## 2. 生成默认记忆配置

`$deploy` 必须是仓库外尚不存在的新目录。生成器拒绝覆盖已有部署：

```powershell
$deploy = Join-Path $env:LOCALAPPDATA 'dsh-memory-deployment'
node scripts/configure.mjs --out $deploy
if ($LASTEXITCODE -ne 0) { throw 'Configuration generation failed.' }
$paths = Get-Content (Join-Path $deploy 'paths.json') -Raw | ConvertFrom-Json
```

默认模式为 `memory`，生成三个文件：

- `dsh.patch.yml`：记忆桥、人设、状态目录和纯净插件声明；不会开启会话纯净开关。
- `basic-memory.mcp.json`：指向独立Basic Memory配置目录的stdio MCP连接。
- `paths.json`：DSH home、Vault、人设、自我档案及管理目录的位置，以及 requiredPlugins 安装清单。

本路线不生成 `codex.mcp.toml`，不插入 `dsh-mcp-control`，不需要 `DSH_MCP_CONTROL_TOKEN`。不固定模型供应商。

## 3. 安装记忆组件并启用

继续[记忆接入说明](memory.md)，按顺序完成：

1. 安装官方Basic Memory、Obsidian，以及会话设置、记忆桥、全局设置、纯净模式四个插件。
2. 登记同一个 `personal` 项目和Vault。
3. 复制虚构起始人设、自我档案示例，或编写自己的内容。
4. 启动独立DSH，配置自己可用的模型，在需要记忆的会话启用Basic Memory MCP并验证。

步骤使用本页的 `$starter`、`$deploy`、`$paths`，无需再生成配置。

## 日常启动与新终端

完成上述组件安装后：

```powershell
& (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy -Start
```

使用独立回环端口8931，打开启动日志给出的登录入口。若端口已被占用，先确认是否是自己的旧实例，不停止未知程序。

在新PowerShell终端需要重新加载该部署路径时：

```powershell
$starter = (Resolve-Path '<主仓库目录>').Path
$deploy = Join-Path $env:LOCALAPPDATA 'dsh-memory-deployment'
. (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy
```

替换尖括号内容。点调用只加载当前终端环境，不启动服务。默认memory模式不会创建控制token，并清除当前终端遗留的工程控制连接变量；已有其他终端和运行实例不受影响。

## 后续选择

- 让其他Agent读取和整理同一套记忆：[第三方Agent协作维护](agents.md)。使用现有记忆配置，不需要创建工程控制部署。
- 确实需要从Codex或其他MCP客户端给DSH派发代码任务：[可选工程控制附录](control.md)。该模式另用 `--mode control` 和控制插件，与共享记忆不是同一个功能。
- 已有部署按 [升级指南](upgrade.md) 先发现与备份；`configure` 不用于覆盖升级。任何重启都先说明影响、写续接记录并暂停，由用户手动完成后再验收。

当前证据与限制见[验证记录](validation.md)。
