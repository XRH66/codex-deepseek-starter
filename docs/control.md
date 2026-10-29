# 可选附录：第三方 Agent 控制 DSH 工程会话

> **兼容范围（2026-10-29）**：本方案已验证 DSH **0.2.1-rc.2**。官方 **0.2.2-alpha.2** 涉及工具、提示词和会话接口调整，尚未完成兼容验证；不要将本次记忆插件更新视为宿主升级许可。先保留现用环境，在隔离部署验证新版。见[官方更新说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.2)。新版宿主要求 Node.js 24.9+；下文较低运行时要求只对应旧适配基线。

返回 [README](../README.md)。本页是额外的工程派工功能，以Codex为示例；日常DSH记忆和第三方Agent共享记忆均不需要本页。共享记忆请读[第三方Agent协作维护](agents.md)。下面使用Windows PowerShell，其他系统尚未验证。

## 1. 准备工具和本仓库

需要 Git、Node.js 22.19+ 或24+、npm，以及已经安装并可用的 Codex。若尚未安装 Harness/pnpm，按[官方仓库](https://github.com/deepseek-ai/deepseek-harness)准备本版基线：

```powershell
npm install --global @deepseek-ai/dsh@0.2.1-rc.2 pnpm@11.7.0
node --version
dsh --version
```

已有其他版本时先检查兼容性，不必替换现用安装；可以在独立环境安装对应版本。此文档的命令由读者显式执行，仓库检查脚本不会安装全局工具。

克隆主方案（三个自研插件及第三方会话设置会在记忆步骤安装）：

```powershell
git clone https://github.com/XRH66/codex-deepseek-starter.git
Set-Location codex-deepseek-starter
```

在本仓库根目录运行，并保留 `$starter`：

```powershell
$starter = (Get-Location).Path
npm ci
npm run check
```

## 2. 安装第三方控制插件源码

该插件由 [mochgolf/dsh-mcp-control](https://github.com/mochgolf/dsh-mcp-control) 提供，MIT。本版核对时 npm registry 尚无同名包，因此从公开源码构建，不使用假设存在的 npm 安装命令。

```powershell
$tools = Join-Path $env:USERPROFILE 'Tools'
New-Item -ItemType Directory -Force $tools | Out-Null
$control = Join-Path $tools 'dsh-mcp-control'
git clone https://github.com/mochgolf/dsh-mcp-control.git $control
if ($LASTEXITCODE -ne 0) { throw 'Clone failed; inspect an existing directory before continuing.' }
git -C $control checkout fdb74ddd872bc005581c035c2e4d6422618a330e
Push-Location $control
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Control plugin dependency install failed.' }
pnpm run build
if ($LASTEXITCODE -ne 0) { throw 'Control plugin build failed.' }
Pop-Location
```

已有 checkout 时确认来源、版本和未提交修改再使用，不执行覆盖式更新。本版不混装另一条 `Codex-DSH-Orchestrator` bridge 路线。

## 3. 生成独立部署配置

`$deploy` 必须是仓库外尚不存在的新目录；下面仅生成配置，不启动服务，不修改已有 Harness/Codex 设置。预先加入 `--with-memory` 会同时生成记忆配置，记忆插件启用步骤仍需按[记忆文档](memory.md)完成。

```powershell
Set-Location $starter
$deploy = Join-Path $env:LOCALAPPDATA 'codex-deepseek-deployment'
node scripts/configure.mjs --out $deploy --mode control --control-root $control
$paths = Get-Content (Join-Path $deploy 'paths.json') -Raw | ConvertFrom-Json
$env:DSH_HOME = $paths.harnessHome
$env:DSH_AGENTS_HOME = $paths.harnessHome
$env:DSH_MCP_URL = 'http://127.0.0.1:8931/mcp'
```

本页默认只生成控制配置，不启用个人记忆。确需同时部署记忆时，在生成命令中添加 `--with-memory`，并完成[记忆文档第1–3步](memory.md)后再启动。不能在同一输出目录再次生成。审查 `dsh.patch.yml`；其中路径是实际字面值，不依赖 YAML 自动展开变量。`DSH_HOME` 和 `DSH_AGENTS_HOME` 均指向独立目录，避免接触已有用户主目录部署。

## 4. 凭据、模型与启动

启动前确认端口8931未被其他服务占用。在用于启动的 PowerShell 中执行：

```powershell
& (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy -Start
```

该脚本只启动你选定的独立部署：设置对应的DSH目录、数据路径和端口；首次生成随机控制token并保存在部署目录的 `mcp-token.private`，以后复用。它不打印token，也不改现有Codex配置。部署目录包含凭据和运行数据，应放在自己的受保护目录，不上传或共享。

在第二个 PowerShell 终端中重新定位主方案与部署目录，**点调用**相同脚本，将同一个token和路径载入当前终端：

```powershell
$starter = (Resolve-Path '<主方案目录>').Path
$deploy = Join-Path $env:LOCALAPPDATA 'codex-deepseek-deployment'
. (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy
```

尖括号内容替换为实际目录。后续CLI、记忆命令和Codex CLI可从这个终端运行。不要把token本身写进命令参数或文章。

打开**这个实例**启动日志中的登录入口，按官方流程配置模型并确认供应商、模型和费用。默认委派技能期望 `opencode-go / deepseek-v4.1-flash / high`；若你选择其他模型，应同步自己的技能约定。供应商认证是用户自己的账户，仓库不提供、不复制账户，也不会自动切换或购买套餐。

MCP控制token和Web登录凭据是两套凭据。端口冲突时先停止自己的旧测试实例或修改配置与启动脚本使端口一致，不接管未知进程。

## 5. Codex 配置与技能

配置生成器输出 `codex.mcp.toml`，按 [OpenAI 官方 MCP 文档](https://learn.chatgpt.com/docs/extend/mcp)将该段合并到自己选择的 Codex 配置。已有 `dsh_harness` 时先检查冲突，不能重复添加或覆盖现用服务。

```toml
[mcp_servers.dsh_harness]
url = "http://127.0.0.1:8931/mcp"
bearer_token_env_var = "DSH_MCP_CONTROL_TOKEN"
```

Codex进程也需继承相同token环境变量。可以从已设置环境变量的终端启动Codex CLI；桌面程序若没有继承该环境变量，需要用其支持的本地环境配置方式设置，不能假设修改终端变量会改变已运行程序。

本仓库CLI本身可以直接用 `DSH_MCP_URL` 和 `DSH_MCP_CONTROL_TOKEN`，无需修改Codex配置；也支持 `DSH_CODEX_CONFIG` 指向配置文件，否则从 `CODEX_HOME/config.toml` 或用户主目录 `.codex/config.toml` 读取。优先环境token，其次配置引用的token环境变量，再其次兼容原有内联Authorization。不要在公共文件写真实凭据。

技能按[官方技能说明](https://learn.chatgpt.com/docs/build-skills)复制到实际工程的 `.agents/skills/` 下。在仓库根目录、使用一个新的演示工程：

```powershell
$work = Join-Path $deploy 'demo-project'
New-Item -ItemType Directory -Force (Join-Path $work '.agents/skills') | Out-Null
Copy-Item -Recurse (Join-Path $starter 'skills/delegate-to-deepseek-harness') (Join-Path $work '.agents/skills/')
$env:DSH_STARTER_ROOT = $starter
```

保留 `DSH_STARTER_ROOT`，使技能能定位CLI。工程已有规则时局部合并，避免用本仓库AGENTS覆盖用户项目规则。

## 6. 实际派工、续接与验收

先确认工程工作区没有启用个人 `basic_memory` MCP；开启它会让轮后整理保存工程简报。若此前全局启用了记忆，在工程工作区显式关闭后再派工。在继承了同一token的调用终端执行：

```powershell
$receipt = node (Join-Path $starter 'scripts/dsh-cli.mjs') start --cwd $work --task-file (Join-Path $starter 'examples/task.md') --permission danger-full-access | ConvertFrom-Json
node (Join-Path $starter 'scripts/dsh-cli.mjs') result --session $receipt.session_id --request $receipt.request_id --wait-ms 20000
```

返回 `running` 时用同样的 `result` 再等；`ended` 后检查 `reason.kind`，并由Codex读取实际 `greeting.txt`，确认内容准确。回执只表示接收，不能代替实际文件验收。审批请求在Harness界面由用户处理，CLI不代批。

续接使用 `send --session <session_id> --task-file <new-task>`；`status --session <session_id>`用于接管或诊断。将session/request身份保存在工程自己的私有任务记录中，不上传聊天日志。

## 升级与排查

0.2.0起生成器默认是memory模式；新建工程控制部署须显式指定 `--mode control`。0.1.0已生成的控制部署仍可用启动脚本按原有 `codex.mcp.toml` 加载，无需重新生成或迁移已有数据。

- 连接失败：检查两个进程的token、`DSH_MCP_URL`、端口及独立实例是否运行；不要把完整配置或日志发到公开issue。
- 升级自研插件：先读取变更与固定版本，在会话及补写队列空闲时更新同一个独立profile，涉及重启先保存续接记录并暂停，由用户手动重启该实例。仅修改仓库文件不会让已运行进程自动加载新代码。
- 升级控制插件：审查新提交，重新构建，并同步生成配置中的源码位置；本版未实现自动升级或自动重启。
- 停止或移除测试部署前确认对应进程和数据位置；本仓库不提供批量清理命令。

当前验证范围见[验证记录](validation.md)。
