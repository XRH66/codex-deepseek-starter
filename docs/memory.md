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
# 本次配套发布的完整提交，不自动跟随主分支。
$bridgeCommit = '8180905355e5d59d81c3e867681cf68165509435' # 0.2.0
$settingsCommit = 'f5778e8a7ddcf2be5ba83f895db587b384455a78' # 0.2.0
$pureCommit = '014162d3137fcd35458340b09cdd89877baca490' # 0.1.0
foreach ($commit in @($bridgeCommit, $settingsCommit, $pureCommit)) {
    if ($commit -notmatch '^[0-9a-f]{40}$') { throw 'Release commit is not finalized; stop before installation.' }
}
dsh plugin --profile web add "github:XRH66/dsh-pure-mode#$pureCommit"
dsh plugin --profile web add "github:XRH66/dsh-basic-memory-bridge#$bridgeCommit"
dsh plugin --profile web add "github:XRH66/dsh-global-settings#$settingsCommit"
```

| 插件 | 归属 | 用途 |
| --- | --- | --- |
| [dsh-session-settings](https://github.com/u9521/dsh-session-settings) | 第三方，MIT | MCP配置导入、探测及会话可见性控制 |
| [dsh-basic-memory-bridge](https://github.com/XRH66/dsh-basic-memory-bridge) | 本方案自研，独立仓库 | 自动召回、整理、纠正、补写、索引、遗忘强化 |
| [dsh-pure-mode](https://github.com/XRH66/dsh-pure-mode) | 本方案自研，独立仓库，0.1.0 | 当前会话纯净开关，保留原MCP设置 |
| [dsh-global-settings](https://github.com/XRH66/dsh-global-settings) | 本方案自研，独立仓库 | 全局人设、自我档案及记忆状态面板 |

配套版本为桥0.2.0、设置0.2.0、纯净插件0.1.0。上方固定提交用于复现发布组合，不自动追随主分支。源代码及独立测试在对应仓库，主方案不重复维护插件副本。

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

事实、个人记录、索引导航与时间线仍使用原检索通道，随后与近期聊天统一装配、去重；默认记忆正文总预算2400字符，不是整个请求的token上限。近期片段最多先占正文预算60%，空缓存不占额度；受检索时间预算限制，允许空召回。

近期缓存默认开启、估算容量16384 token，只存直接用户和最终助手文字，从新消息开始积累，不回填全历史；容量估计不是供应商账单。纯净模式不读写此缓存，普通会话按个人库共享。当前要求按同范围最新明确来源更新，旧版本独立保留历史。

遗忘是检索权重随时间下降，默认30天半衰期，保留原文；新的用户交流有依据时小幅强化，自己读取、修订、整理不强化。想法和日记按条目计算，自我档案作为固定软上下文单独处理。模型仍可能漏记、误记或产生语义重复。

全部启用会话共享一个个人库，尚无多人隐私隔离。个人笔记会通过上下文发送给当前配置的模型供应商；本地存储不等于推理离线。具体参数、删除工具限制和已知边界见各插件README。

## 纯净模式与升级

安装插件不等于开启开关。新空白会话第一条消息前点击“纯净模式”，默认关闭、按会话持久化；回合中切换从下一新回合生效。开启后关闭个人注入与 Basic Memory/个人记录/近期聊天工具，不改 AGENTS、模型、权限及原 MCP 勾选。旧聊天仍在，不能把切换当成历史抹除。旧普通记忆待办保留，升级时仍需显式隔离后台。

已有部署请按 [升级指南](upgrade.md) 和 [旧库整理](memory-migration.md) 执行；需要重启时先记录影响与进度、暂停等待用户手动操作。GenUI / billion-context 见 [可选组件](optional-components.md)。


后台捕获默认上限为 `captureTimeoutMs: 90000`、`captureMaxTokens: 8192`；完成即返回，不是每次固定时长或消耗。旧 profile 的显式20000/1024会继续覆盖源码默认；按 [升级指南](upgrade.md) 展示差异、保留有意自定义，仅在用户同意升级默认行为的范围内合并，并验证实际生效值。
