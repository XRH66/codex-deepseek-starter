# 维护入口

先读 README.md，再按任务读取 docs/ 中的安装或记忆说明。

- CLI 与本地检查在 scripts/；自研插件源码在 README 指向的独立仓库，修改后运行相关测试。
- 运行配置、凭据、聊天与记忆数据保存在仓库外；示例和测试只用虚构内容。
- 发布文件由 release-files.json 明确列出；新增公开文件经审查后加入，运行 npm run check。
- Codex 负责需求、范围、方案、审查和独立验收；执行委派见 skills/delegate-to-deepseek-harness/SKILL.md。
- 在临时目录测试，不更改现用 Harness、Codex 配置或记忆库。提交、推送和发布按用户明确授权执行。
