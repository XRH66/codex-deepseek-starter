# Codex × DeepSeek Harness：协作与可选长期记忆

让 Codex 负责需求、方案、代码审查与独立验收，让 DeepSeek Harness 执行具体任务。可按需接入 Basic Memory 与 Obsidian，保存事实、经历和助手自己的记录。

这是面向 Windows PowerShell 的 **0.1.0 完整集成入口**。主仓库提供配置生成、独立部署启动、CLI、委派技能和从零接入文档；两个自研插件由公开仓库按固定提交安装。需要自己的模型账户，首次仍需完成供应商配置和MCP启用。

## 组成与来源

| 组件 | 职责 | 来源 |
| --- | --- | --- |
| 本仓库 | Codex × Harness 协作、CLI、技能、配置与启动 | 本方案集成代码 |
| [记忆桥](https://github.com/XRH66/dsh-basic-memory-bridge) | 召回、整理、纠正、索引、遗忘与强化 | 自研插件 |
| [全局设置](https://github.com/XRH66/dsh-global-settings) | 人设、自我档案、记忆状态面板 | 自研插件 |
| [dsh-mcp-control](https://github.com/mochgolf/dsh-mcp-control) | Harness 会话控制接口 | 第三方插件 |
| [dsh-session-settings](https://github.com/u9521/dsh-session-settings) | MCP接入与会话开关 | 第三方插件 |
| [Basic Memory](https://github.com/basicmachines-co/basic-memory) | 本地Markdown存储、检索与MCP | 上游开源项目 |
| [Obsidian](https://github.com/obsidianmd/obsidian-releases) | 查看和编辑同一记忆Vault | 官方客户端，单独安装 |

从[完整安装步骤](docs/setup.md)开始；默认生成记忆和人设配置，工程协作也可单独使用。完整方案由上述组件组成，不把第三方软件、账户或个人记忆打包进仓库。

## 两条使用路线

| 路线 | 包含内容 | 从哪里开始 |
| --- | --- | --- |
| 工程协作 | UTF-8 任务文件、派工、续接会话、精简结果、Codex 独立验收 | [安装与第一次派工](docs/setup.md) |
| 可选长期记忆 | 回答前召回、轮后整理、纠正与补写、主题索引、自然遗忘与强化、个人记录和自我档案 | 先完成工程协作，再读[记忆接入](docs/memory.md) |

记忆不是工程协作的前置条件。所有启用记忆的会话共享一个 `personal` 库；当前面向个人使用，不提供多人隐私隔离。

## 首次检查

前置：Node.js 22.19+（或24+）、npm，以及下文安装的官方 Harness。下载本仓库后，在仓库根目录运行：

```powershell
npm ci
npm run check
node scripts/dsh-cli.mjs --help
node scripts/configure.mjs --help
```

这些命令检查本地代码，不会启动 Harness、修改 Codex 设置或读写你的记忆库。`configure` 必须指定仓库外的新目录，只生成待审核配置。

## 仓库内容

- `scripts/`：便携 CLI、配置生成器、发布文件与链接检查。
- [dsh-basic-memory-bridge](https://github.com/XRH66/dsh-basic-memory-bridge)：独立自研插件，自动召回、整理与记忆维护。
- [dsh-global-settings](https://github.com/XRH66/dsh-global-settings)：独立自研插件，全局人设、自我档案及记忆状态面板。
- `skills/`：可复制安装的委派技能；[工程规则](AGENTS.md)适用于本仓库维护。
- `examples/`：虚构任务、人设与自我档案；不是实际使用者的内容。
- [来源与许可](NOTICE.md)、[隐私与公开边界](docs/privacy.md)、[验证与限制](docs/validation.md)。

## 软件来源

[Obsidian 官方发布仓库](https://github.com/obsidianmd/obsidian-releases)与[Basic Memory 官方仓库](https://github.com/basicmachines-co/basic-memory)只保留链接、安装命令和必要接入步骤，不随仓库打包。具体命令见[记忆接入](docs/memory.md)。

本版以 Harness 0.2.1-rc.2、Basic Memory 0.24.1 的接口为适配基线。CLI不会替用户选择模型、购买套餐或自动切换供应商。先确认实际模型与费用，再派工。

## 验证范围

已验证Windows独立profile安装和启动、控制接口发现、27项记忆工具探测，以及真实记忆写入后跨进程读取和检索。自动化配置、CLI模拟传输、隐私白名单及链接检查通过。

本发布包的真实模型派工与跨聊天自动记忆闭环尚未验证，也未在另一台全新电脑完成安装验收；不要把上述检查当作这些验收。详细证据口径见[验证与限制](docs/validation.md)。

## 后续维护

主方案的CLI、技能和说明在本仓库维护；两个自研插件在各自独立仓库维护，主方案引用审查过的固定提交。通过相关测试后再更新自己选择的独立部署。运行配置、凭据与记忆数据始终在仓库外。升级不会自动重启正在运行的服务；安装路径和升级步骤见[安装说明](docs/setup.md)。

MIT，第三方软件与引用分别适用其原许可，见[来源与许可](NOTICE.md)。
