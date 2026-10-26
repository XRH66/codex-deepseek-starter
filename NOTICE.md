# 来源、致谢与许可

本项目是基于第三方软件搭建的记忆与Agent协作方案，不是从零实现的聊天平台或记忆引擎。感谢下列项目及贡献者。仓库拥有者、许可证中的版权主体和本项目维护者可能不同；原版权声明按上游原文保留。

核对日期：2026-10-26。固定版本以安装文档、下表和 `package-lock.json` 为准；升级时同时更新对应来源与许可信息。

## 默认记忆方案依赖谁

| 项目及来源 | 上游维护方 | 本方案如何使用 | 版本与许可依据 |
| --- | --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | deepseek-ai / DeepSeek | 提供聊天、模型调用、工具、插件和会话运行环境；不由本项目开发 | 适配0.2.1-rc.2；[上游MIT许可](https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE) |
| [Basic Memory](https://github.com/basicmachines-co/basic-memory) | basicmachines-co及贡献者 | 提供Markdown记忆存储、检索、索引和MCP；通过独立本地进程接入，不复制或重新分发引擎源码 | 固定0.24.1；安装包元数据标记 **AGPL-3.0-or-later**，见[对应版本许可](https://github.com/basicmachines-co/basic-memory/blob/v0.24.1/LICENSE) |
| [dsh-session-settings](https://github.com/u9521/dsh-session-settings) | **u9521**及贡献者 | 提供MCP管理、工具探测及会话启用开关；直接安装第三方插件，未把它改称自研 | 固定提交[`237537b`](https://github.com/u9521/dsh-session-settings/tree/237537bb11663fd02bb14e5b415c92ff1a4320cd)；[MIT，版权原文为2025 u9521](https://github.com/u9521/dsh-session-settings/blob/237537bb11663fd02bb14e5b415c92ff1a4320cd/LICENSE) |
| [Obsidian](https://github.com/obsidianmd/obsidian-releases) | Obsidian | 直接查看和编辑同一Vault；仅提供官方下载及安装入口，不随本仓库打包 | 客户端遵循[Obsidian自己的许可与条款](https://obsidian.md/license)；发布仓库不等于客户端开源源码，也不适用本仓库MIT |

## 本项目做了哪些部分

| 内容 | 本项目负责的范围 | 与第三方的边界 |
| --- | --- | --- |
| [dsh-basic-memory-bridge](https://github.com/XRH66/dsh-basic-memory-bridge) | 本项目维护的DSH插件：自动召回、轮后整理、纠正、补写、索引维护、遗忘强化及个人记录策略 | 调用官方Basic Memory MCP；底层存储、检索引擎属于Basic Memory；插件自身[MIT](https://github.com/XRH66/dsh-basic-memory-bridge/blob/main/LICENSE) |
| [dsh-global-settings](https://github.com/XRH66/dsh-global-settings) | 本项目维护的全局人设、自我档案与记忆状态面板 | 使用DSH插件及Web接口；不是DSH官方功能；插件自身[MIT](https://github.com/XRH66/dsh-global-settings/blob/main/LICENSE) |
| 本仓库配置生成、启动脚本、安装说明和共享记忆维护约定 | 将上述组件串成独立部署，并明确客户端如何共用记忆 | 不把第三方软件、模型、账户或个人数据作为本项目原创内容分发 |

两个插件源码在各自仓库维护，主仓库按[记忆安装文档](docs/memory.md)中的完整提交号引用。本仓库自己的代码使用[MIT](LICENSE)，这不是对所有依赖的统一授权。

## 可选工程控制的上游与改编

这些内容仅用于[工程控制附录](docs/control.md)，不是两条记忆路线的前置条件。

| 本仓库中的内容 | 原项目 / 维护方 | 引用、改编或调用关系 |
| --- | --- | --- |
| DSH会话控制服务 | [mochgolf/dsh-mcp-control](https://github.com/mochgolf/dsh-mcp-control)，仓库维护方 **mochgolf** | 从固定提交[`fdb74dd`](https://github.com/mochgolf/dsh-mcp-control/tree/fdb74ddd872bc005581c035c2e4d6422618a330e)构建0.2.1插件；提供start/send/status/result等MCP接口。MIT；[保留的原许可证](third-party/dsh-mcp-control.LICENSE)中的版权主体为 **2026 DeepSeek**，不改成本站维护者 |
| [scripts/dsh-cli.mjs](scripts/dsh-cli.mjs) | 围绕上述控制插件接口编写的本机CLI，经本方案整理为可移植客户端 | 本版加入可配置端点、TOML/环境凭据读取及精简结果处理。固定上游提交没有这个CLI文件，不能把本地新增脚本说成上游原生功能；控制服务本身仍归上游项目 |
| [委派技能](skills/delegate-to-deepseek-harness/SKILL.md) | [LomoMao/delegate-to-deepseek-harness](https://github.com/LomoMao/delegate-to-deepseek-harness)，维护方 **LomoMao**及贡献者 | 参考技能结构与协作方法，并按本方案CLI及验收规则重写精简版，不是原样分发。核对参考副本提交[`0944780`](https://github.com/LomoMao/delegate-to-deepseek-harness/tree/0944780334ea8468a09e11a454ecd510f50f7263)；[原MIT许可证](third-party/delegate-to-deepseek-harness.LICENSE)保留不变 |

## JavaScript直接依赖与传递依赖

下表根据当前锁文件和实际安装包的 `package.json` 核对；不是把依赖代码重新授权为MIT。运行 `npm ci` 从npm获取包，本仓库不提交 `node_modules`。包内LICENSE/NOTICE随对应包保留；版本变更时重新核对。

| 包 | 锁定版本 | 用途 / 依赖层级 | 上游来源 | 许可 |
| --- | --- | --- | --- | --- |
| `@modelcontextprotocol/client` | 2.4.0 | 直接依赖：MCP客户端 | [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Apache-2.0 |
| `@modelcontextprotocol/core` | 2.4.0 | 传递依赖 | [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Apache-2.0 |
| `cross-spawn` | 7.0.6 | 传递依赖 | [moxystudio/node-cross-spawn](https://github.com/moxystudio/node-cross-spawn) | MIT |
| `eventsource` | 3.0.7 | 传递依赖 | [EventSource/eventsource](https://github.com/EventSource/eventsource) | MIT |
| `eventsource-parser` | 3.1.1 | 传递依赖 | [rexxars/eventsource-parser](https://github.com/rexxars/eventsource-parser) | MIT |
| `isexe` | 2.0.0 | 传递依赖 | [isaacs/isexe](https://github.com/isaacs/isexe) | ISC |
| `jose` | 6.2.13 | 传递依赖 | [panva/jose](https://github.com/panva/jose) | MIT |
| `path-key` | 3.1.1 | 传递依赖 | [sindresorhus/path-key](https://github.com/sindresorhus/path-key) | MIT |
| `pkce-challenge` | 5.0.1 | 传递依赖 | [crouchcd/pkce-challenge](https://github.com/crouchcd/pkce-challenge) | MIT |
| `shebang-command` | 2.0.0 | 传递依赖 | [kevva/shebang-command](https://github.com/kevva/shebang-command) | MIT |
| `shebang-regex` | 3.0.0 | 传递依赖 | [sindresorhus/shebang-regex](https://github.com/sindresorhus/shebang-regex) | MIT |
| `smol-toml` | 1.9.1 | 直接依赖：解析Codex TOML配置 | [squirrelchat/smol-toml](https://github.com/squirrelchat/smol-toml) | BSD-3-Clause |
| `which` | 2.0.2 | 传递依赖 | [isaacs/node-which](https://github.com/isaacs/node-which) | ISC |
| `yaml` | 2.9.1 | 开发依赖：测试中解析YAML | [eemeli/yaml](https://github.com/eemeli/yaml) | ISC |
| `zod` | 4.6.7 | 传递依赖 | [colinhacks/zod](https://github.com/colinhacks/zod) | MIT |

其中MCP TypeScript SDK的安装包作者字段为Anthropic, PBC，项目由modelcontextprotocol组织维护；2.4.0的client/core包使用Apache-2.0，不应沿用其他版本的许可印象。

## 安装工具与可选客户端

安装过程使用[Node.js](https://github.com/nodejs/node)、[npm](https://github.com/npm/cli)、[Git](https://git-scm.com/)、[uv](https://github.com/astral-sh/uv)及[Python](https://www.python.org/)；可选工程控制构建使用[pnpm](https://github.com/pnpm/pnpm)。这些工具由各自项目提供，本仓库只给出调用和安装步骤，不重新分发其运行时。

支持MCP的第三方Agent是使用者自行选择的客户端，不属于本仓库组件。工程附录中的Codex示例来自[OpenAI Codex](https://developers.openai.com/codex/)，只说明连接方法；本方案不附带该产品或账户，也不代表获得官方背书。

所有第三方项目名称及品牌归各自权利人。发布文章或介绍本项目时，应保留上述上游名称与链接，明确本项目贡献的是插件策略和集成工作，不将Basic Memory、DSH、会话设置、控制服务或参考技能描述为全部自研。
