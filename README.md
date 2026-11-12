# DSH 长期记忆与人设

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）加上本地长期记忆和固定人设。记忆按对话开启，原话由程序保存，模型需要时自己去查；后台把聊天整理成 Markdown 条目，可以用 Obsidian 直接查看和修改。

**不需要 Codex、OpenAI 账户或任何第三方 Agent 软件。** 只要有 DSH 和你自己能用的模型服务。本项目不选择、购买或切换模型服务。仓库名沿用历史名称 `codex-deepseek-starter`，以保留已有链接，名称不代表需要安装 Codex。

## 组成

| 组件 | 作用 | 是否必装 |
| --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | 聊天、模型调用和插件运行环境 | 必装 |
| [dsh-memory-starter](https://github.com/XRH66/dsh-memory-starter) 0.5.0 | 记忆插件：按对话开启、原话库、按需检索、后台整理、遗忘曲线、短期接续、可选向量检索、旧记忆迁移 | 必装 |
| [dsh-global-settings](https://github.com/XRH66/dsh-global-settings) 0.2.0 | 全局人设、自我档案、当前对话的记忆状态显示 | 推荐 |
| [Obsidian](https://obsidian.md/) | 查看、编辑记忆 Vault | 可选 |

两个插件都是本项目自研，各自在独立仓库维护，这里按固定提交安装，不跟随主分支变动。来源与许可见 [NOTICE.md](NOTICE.md)。

## 开始

首版面向 Windows PowerShell，需要 Git、Node.js 22.19+ 或 24+、npm。

```powershell
git clone https://github.com/XRH66/codex-deepseek-starter.git
Set-Location codex-deepseek-starter
npm ci
npm run check
```

然后按 [安装说明](docs/setup.md) 走：生成一份独立部署 → 装两个插件 → 启动 DSH → 在「记忆框架」页面完成首次配置。已经在用旧版（0.4.0，或 0.3.0 的 Basic Memory 组合）的，看 [升级说明](docs/upgrade.md)。

## 隐私

记忆、原话库、索引、配置和密钥都在你选的本地目录里，不在仓库里。本地存储不代表推理离线：开启记忆的对话和后台整理会把相关内容发给你选的模型；选用接口向量模型时，被索引的内容也会发给向量服务。详见 [隐私说明](docs/privacy.md)。

## 其他

- 验证了什么、没验证什么：[验证记录](docs/validation.md)
- 版本变化：[更新记录](docs/changelog.md)
- 第三方组件的可选补丁（GenUI、billion-context）：[可选组件](docs/optional-components.md)
- 从 Codex 等 MCP 客户端给 DSH 派发代码任务：[工程控制附录](docs/control.md)，与记忆无关，按需使用。

MIT。当前版本 0.5.0，适配 DSH 0.2.1-rc.5。
