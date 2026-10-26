# DSH 长期记忆与人设 · 第三方 Agent 协作维护

给日常使用的 DeepSeek Harness 接入长期记忆、人设与可修订自我档案。记忆保存在本地，通过 Obsidian 查看和编辑；也可以让支持 MCP 的第三方 Agent 软件接入同一套记忆，帮助检索、补充和整理。

**默认路线不需要 Codex、OpenAI 账户或任何第三方 Agent 软件。** 使用者只需准备 DSH、自己可用的模型服务，以及下文的记忆组件。本项目不会选择、购买或自动切换模型服务。

## 两条使用路线

| 路线 | 适合谁 | 入口 |
| --- | --- | --- |
| **默认：DSH 记忆与人设** | 在DSH里聊天，希望助手记住事实、经历、偏好并保留自己的记录 | [从安装到启用](docs/setup.md) |
| **可选：第三方 Agent 协作维护记忆** | 希望其他支持MCP的Agent也能读取、补充和整理同一套记忆 | [共享记忆接入](docs/agents.md) |

第二条是在第一条的记忆库上增加客户端，不需要更换模型、不需要复制数据库，也不要求用Codex。Codex只是可接入客户端的一个例子。

旧版的“Codex规划、DSH执行代码任务”另保留为[可选工程控制附录](docs/control.md)，两条记忆路线均不依赖它。仓库URL沿用历史名称 `codex-deepseek-starter`，以保留已有链接；名称不表示需要安装Codex。

## 来源与致谢

本方案基于 **[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)** 和 **[Basic Memory](https://github.com/basicmachines-co/basic-memory)**，MCP会话设置使用 **[u9521/dsh-session-settings](https://github.com/u9521/dsh-session-settings)**。可选工程控制使用 **[mochgolf/dsh-mcp-control](https://github.com/mochgolf/dsh-mcp-control)**，委派技能参考 **[LomoMao/delegate-to-deepseek-harness](https://github.com/LomoMao/delegate-to-deepseek-harness)**。感谢原作者与贡献者。

本项目负责记忆桥、人设面板和整合接入；底层平台、记忆引擎及上述第三方组件各有来源。Basic Memory 0.24.1使用AGPL-3.0-or-later，不能用本仓库MIT覆盖；Obsidian遵循自己的条款。完整的**作者/维护方、用途、固定版本、改编关系及依赖许可**见[来源与许可清单](NOTICE.md)。

## 组成与职责

| 组件 | 职责 | 哪条路线需要 |
| --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | 日常聊天与模型工具运行环境 | 默认路线 |
| [Basic Memory](https://github.com/basicmachines-co/basic-memory) | 本地Markdown存储、检索、索引与MCP接口 | 两条路线共用 |
| [记忆桥](https://github.com/XRH66/dsh-basic-memory-bridge) | DSH回答前召回、轮后整理、纠正、补写、索引、遗忘与强化 | DSH自动流程 |
| [全局设置](https://github.com/XRH66/dsh-global-settings) | 人设、自我档案、记忆状态面板 | DSH人设与状态 |
| [dsh-session-settings](https://github.com/u9521/dsh-session-settings) | MCP接入与DSH会话开关 | 默认路线 |
| [Obsidian](https://github.com/obsidianmd/obsidian-releases) | 直接查看和编辑同一个记忆Vault | 记忆管理入口 |
| 使用者选择的第三方Agent | 经MCP检索、补充与整理共享记忆 | 可选协作路线 |

记忆桥和全局设置是本项目自研插件；Basic Memory、DSH和会话设置来自各自上游。Obsidian官方客户端单独安装，不属于本仓库MIT许可覆盖的代码。[来源与许可](NOTICE.md)。

## 从这里开始

首版支持Windows PowerShell。准备Git、Node.js 22.19+或24+及npm，然后：

```powershell
git clone https://github.com/XRH66/codex-deepseek-starter.git
Set-Location codex-deepseek-starter
npm ci
npm run check
```

按[默认安装](docs/setup.md)准备DSH并生成配置：

```powershell
$deploy = Join-Path $env:LOCALAPPDATA 'dsh-memory-deployment'
node scripts/configure.mjs --out $deploy
```

默认生成记忆与人设配置，**不需要控制插件路径，不生成Codex配置或会话控制凭据**。随后按文档安装三个配套插件、登记Vault、启用MCP和启动DSH。配置生成不等于已经部署；不会修改现用实例。

已有DSH用户可在独立目录验证后按插件说明接入现用实例，先核对版本与数据路径，不把新配置覆盖到现有库。模型账户和首次MCP启用仍需由使用者完成。

## 协作维护的边界

DSH和第三方Agent通过同一个Basic Memory项目访问同一份笔记。DSH桥负责它所在会话中的自动召回、整理和记忆策略；其他Agent的普通对话不会因此自动进入这套生命周期，需要按任务显式调用记忆工具。

一个人的多个客户端可以共用个人库；本项目不提供多人隐私隔离或跨机器同步。共同维护时先读后改、保留事实来源与元数据，同一笔记避免并发修改。具体操作约定见[协作说明](docs/agents.md)。

## 验证与维护

此前已验证独立DSH部署、27项记忆工具探测、真实记忆写入后跨进程读取和检索，以及可选工程控制接口发现。两条配置路线及启动行为有针对性检查；实际范围见[验证记录](docs/validation.md)。

本发布包的真实模型派工与跨聊天自动记忆闭环尚未验证，也未在另一台全新电脑完成安装验收。第三方Agent调用自己的模型时仍受该软件与供应商的配置影响。

运行配置、凭据、聊天及记忆保存在仓库外。记忆本地存储不代表模型推理离线，相关内容会发送给所选模型服务。[隐私说明](docs/privacy.md)。两个自研插件按固定提交引用，各自独立维护；更新代码后需要在空闲时重载对应DSH实例。

MIT。当前集成版0.2.0；适配基线为DSH 0.2.1-rc.2、Basic Memory 0.24.1。
