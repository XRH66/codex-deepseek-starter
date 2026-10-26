---
name: delegate-to-deepseek-harness
description: 在已选择工程派工路线的项目中，让 DeepSeek Harness 执行代码、脚本或配置任务，由 Codex 规划、审查和独立验收。共享记忆维护使用 Basic Memory MCP；普通问答及用户指定由 Codex 实施的任务直接处理。
---

# Codex 与 DeepSeek Harness 协作

Codex 负责理解需求、划定范围、方案与验收；Harness 负责具体实现及自检。
先用环境变量 DSH_STARTER_ROOT 定位方案安装目录，按该目录 docs/control.md 确认工程控制安装，CLI位于 scripts/dsh-cli.mjs。变量缺失时从已有项目配置或用户提供的安装位置定位，不假设本技能目录就是方案目录。仅需协作维护记忆时使用 docs/agents.md 的共享MCP连接，无需安装本技能。

1. 读项目规则、相关代码及未提交差异。写一个 UTF-8 任务文件，包含目标、允许修改路径、约束、可观察验收条件；要求执行者精简报告交付路径、检查与阻塞。
2. 先确认专用工程工作区未启用个人 basic_memory MCP，防止调度简报自动进入个人库；已有全局继承时先在该工作区覆盖关闭。有准确且空闲的 Harness 会话时续接；首次接管先核对身份、cwd 和当前模型。否则在实际项目目录开始任务：

   ```text
   node <starter>/scripts/dsh-cli.mjs start --cwd <project> --task-file <task-file> --permission danger-full-access
   node <starter>/scripts/dsh-cli.mjs send --session <session_id> --task-file <task-file>
   ```

3. session_id 与 request_id 保存在项目已有私有任务记录中。默认用 result 长轮询，每次至多20秒；running 时继续等待，不反复拉完整日志：

   ```text
   node <starter>/scripts/dsh-cli.mjs result --session <session_id> --request <request_id> --wait-ms 20000
   ```

4. 收到 ended 后核对结束原因与真实交付。Codex 独立检查必要差异和针对性结果；返工在同一会话 send。blocked_on_approval 交给人处理，CLI 不审批。
5. 达到用户验收条件即收尾，更新原记录；不为小改动追加全量检查或多套报告。

默认目标模型为 opencode-go / deepseek-v4.1-flash / high，但本技能和CLI不安装该供应商、不替用户选择套餐，也不自动切模型。首次派工前应在Harness确认实际路由。未配置或路由不一致时报告，模型费用与替代模型由用户明确决定。

danger-full-access 只是执行权限，不能扩大任务范围；提交、推送、发布和删除无关内容按用户明确授权执行。用户指定分工和模型时优先遵从。
