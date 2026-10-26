# DSH 长期记忆与人设接入

返回 [README](../README.md)。先完成[默认安装第1–2步](setup.md)，生成默认memory配置。以下沿用 `$starter`、`$deploy` 和 `$paths`；无需Codex、控制插件或工程派工技能。

## 官方软件

[Obsidian 官方发布仓库](https://github.com/obsidianmd/obsidian-releases)：

```powershell
winget install --exact --id Obsidian.Obsidian --source winget
```

[Basic Memory 官方仓库](https://github.com/basicmachines-co/basic-memory)、[官方安装命令](https://docs.basicmemory.com/local/local-install)：

```powershell
uv tool install basic-memory==0.24.1
```

`uv`需预先安装，可按 [uv官方说明](https://docs.astral.sh/uv/getting-started/installation/)准备。这里固定本版适配基线；升级新版Basic Memory前应重新核验工具返回字段。不分发这两个软件、客户端源码、venv、数据库或正式Vault。

## 1. 安装依赖插件

先设置独立profile的环境变量，所有安装只针对它：

```powershell
$paths = Get-Content (Join-Path $deploy 'paths.json') -Raw | ConvertFrom-Json
$env:DSH_HOME = $paths.harnessHome
$env:DSH_AGENTS_HOME = $paths.harnessHome
$env:DSH_MEMORY_VAULT = $paths.vault
dsh plugin --profile web add github:u9521/dsh-session-settings#237537bb11663fd02bb14e5b415c92ff1a4320cd
dsh plugin --profile web add github:XRH66/dsh-basic-memory-bridge#8a8f832a1038cbb4595331aaf08ecb8d4c2a4842
dsh plugin --profile web add github:XRH66/dsh-global-settings#1fb0fcb5994b4dfb6937ea9a09ab226012bcae1b
```

| 插件 | 归属 | 用途 |
| --- | --- | --- |
| [dsh-session-settings](https://github.com/u9521/dsh-session-settings) | 第三方，MIT | MCP配置导入、探测及会话可见性控制 |
| [dsh-basic-memory-bridge](https://github.com/XRH66/dsh-basic-memory-bridge) | 本方案自研，独立仓库 | 自动召回、整理、纠正、补写、索引、遗忘强化 |
| [dsh-global-settings](https://github.com/XRH66/dsh-global-settings) | 本方案自研，独立仓库 | 全局人设、自我档案及记忆状态面板 |

固定提交用于复现首版，不自动追随主分支。源代码及独立测试在对应仓库，主方案不重复维护插件副本。

## 2. 登记独立Vault

```powershell
$env:BASIC_MEMORY_CONFIG_DIR = Join-Path $deploy 'basic-memory-state'
New-Item -ItemType Directory -Force $paths.vault | Out-Null
basic-memory project add personal $paths.vault --local
basic-memory project info personal
```

在Obsidian中把同一个 `$paths.vault` 打开为Vault。本版不要求导入任何历史记录。

生成配置中的 `basic-memory.mcp.json` 已包含相同的 `BASIC_MEMORY_CONFIG_DIR` 和明确的 `transport: "stdio"`。不要省略 transport：本文固定的会话设置插件会跳过缺少此字段的本地服务，可能显示导入0项却没有明显报错。如果MCP找不到命令，把JSON中的 `command` 改成 `Get-Command basic-memory` 返回的绝对程序路径；不要改项目或Vault位置。

## 3. 人设与自我档案

人设插件可以单独使用。以下复制的是虚构起始示例；在全新独立部署执行，已有文件时命令会停止：

```powershell
if ((Test-Path -LiteralPath $paths.persona) -or (Test-Path -LiteralPath $paths.selfProfile)) { throw 'Existing persona/profile; review instead of overwriting.' }
New-Item -ItemType Directory -Force (Split-Path $paths.persona), (Split-Path $paths.selfProfile) | Out-Null
Copy-Item (Join-Path $starter 'examples/persona.md') $paths.persona
Copy-Item (Join-Path $starter 'examples/self-profile.md') $paths.selfProfile
```

`dsh.patch.yml` 将记忆桥Vault、人设自我档案、记忆状态面板指向同一数据布局；管理状态位于Vault外的 `management/memory-status`。不要把这份实际生成的配置提交到仓库。

## 4. 启用并验证

完成上述第1–3步后，在同一PowerShell中启动独立Harness，并用其启动日志中的Web登录入口进入：

```powershell
& (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy -Start
```

默认memory模式只启动DSH记忆与人设，不生成Codex配置或会话控制token。按DSH正常流程选择自己能够使用的模型及供应商，不要求OpenAI账户或特定供应商。已有登录信息不会自动从其他DSH实例复制。

在dsh-session-settings的MCP管理中导入生成的 `basic-memory.mcp.json`，探测工具；server键保留 **basic_memory**。只在需要个人记忆的聊天会话勾选它，确认工具名出现 `mcp__basic_memory__search_notes`、`read_note`、`write_note` 等。工程派工工作区保持关闭，避免把调度简报自动存入个人库；已有全局启用时，先在工程工作区显式覆盖关闭，再创建worker会话。这是第三方插件当前提供的设置入口；本版配置生成器不自动写入其存储或设置开关。

在一个测试会话说一条明确的虚构偏好，例如“部署测试：示例人物喜欢紫色纸飞机，请记住”。成功回答后，在“DSH 全局设置 → 当前对话 · 记忆”检查是否完成整理，并在Obsidian核对真实笔记。再开一个同样启用Basic Memory的会话提问，核对是否能召回；最后将测试内容送人工审阅。只在独立库做这些测试。

没有保存也可能是模型判定无须保存；查状态与真实文件，不把自然语言回复当作写入成功。人设编辑后通过下一次请求确认读取新内容；文件保存不等于某次回答已使用。

## 第三方 Agent 协作维护

需要让其他Agent读取、补充或整理同一套记忆时，按[共享记忆接入说明](agents.md)连接同一个Basic Memory项目。无需先启用工程派工，也无需复制Vault。

## 行为与限制

事实、索引导航、个人记录分别召回。默认事实3条/1200字符、个人记录2条/1600字符、索引1页/600字符；受时间预算限制，允许空召回。

遗忘是检索权重随时间下降，默认30天半衰期，保留原文；新的用户交流有依据时小幅强化，自己读取、修订、整理不强化。想法和日记按条目计算，自我档案作为固定软上下文单独处理。模型仍可能漏记、误记或产生语义重复。

全部启用会话共享一个个人库，尚无多人隐私隔离。个人笔记会通过上下文发送给当前配置的模型供应商；本地存储不等于推理离线。具体参数、删除工具限制和已知边界见各插件README。
