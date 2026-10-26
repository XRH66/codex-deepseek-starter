# 来源与许可

本仓库是个人维护的集成方案，与 OpenAI、DeepSeek、Obsidian 和 Basic Memory 官方没有隶属或背书关系。

| 内容 | 来源与本版处理 | 许可 |
| --- | --- | --- |
| [dsh-basic-memory-bridge](https://github.com/XRH66/dsh-basic-memory-bridge) | 独立自研记忆桥；主方案固定提交引用，不重复分发源码 | 对应仓库 MIT |
| [dsh-global-settings](https://github.com/XRH66/dsh-global-settings) | 独立自研人设与状态面板；主方案固定提交引用，不重复分发源码 | 对应仓库 MIT |
| `scripts/dsh-cli.mjs` | 在本地 dsh-mcp-control CLI 基础上改造：可配端点、标准 TOML/环境凭据读取、20秒等待边界及错误脱敏 | MIT；第三方原许可见下方 |
| 委派技能 | 参考 LomoMao 的技能结构及本机协作实践，重写成可移植的精简版 | MIT；保留原许可 |

上游来源：

- [dsh-mcp-control](https://github.com/mochgolf/dsh-mcp-control)，参考提交 `fdb74ddd872bc005581c035c2e4d6422618a330e`，包版本 0.2.1。[原许可](third-party/dsh-mcp-control.LICENSE)。上游控制插件仅用于可选工程控制附录，由使用者独立安装；两条记忆路线均不需要它，不随本仓库分发。
- [delegate-to-deepseek-harness](https://github.com/LomoMao/delegate-to-deepseek-harness)。[原许可](third-party/delegate-to-deepseek-harness.LICENSE)。
- [dsh-session-settings](https://github.com/u9521/dsh-session-settings)，默认记忆路线的外部依赖，MIT；由使用者按其官方说明安装，本仓库不分发其源码。
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)、[Basic Memory](https://github.com/basicmachines-co/basic-memory)、[Obsidian 官方发布仓库](https://github.com/obsidianmd/obsidian-releases)由各自官方提供。Obsidian 客户端不是本仓库 MIT 许可覆盖的软件。

直接 npm 依赖及其传递依赖分别适用自身许可；准确版本见 package-lock.json。示例人设、自我档案和测试数据用于演示，不包含原使用者的聊天、正式记忆或凭据。
