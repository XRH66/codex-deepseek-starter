# 安装：DSH 记忆与人设

返回 [README](../README.md)。以下步骤面向 Windows PowerShell，会建立一套**独立**的 DSH 部署（单独的 DSH 目录、单独的端口），不碰你已有的 DSH。

## 1. 准备 DSH 和本仓库

需要 Git、Node.js 22.19+ 或 24+、npm。还没有 DSH 的话，按[官方项目](https://github.com/deepseek-ai/deepseek-harness)安装本版适配的版本：

```powershell
npm install --global @deepseek-ai/dsh@0.2.1-rc.5
dsh --version
```

已经装了其他版本时，先确认兼容再决定是否替换。然后准备本仓库：

```powershell
git clone https://github.com/XRH66/codex-deepseek-starter.git
Set-Location codex-deepseek-starter
$starter = (Get-Location).Path
npm ci
npm run check
```

## 2. 生成独立部署

`$deploy` 必须是仓库外、还不存在的新目录，生成器不会覆盖已有目录：

```powershell
$deploy = Join-Path $env:LOCALAPPDATA 'dsh-memory-deployment'
node scripts/configure.mjs --out $deploy
if ($LASTEXITCODE -ne 0) { throw '生成配置失败' }
$paths = Get-Content (Join-Path $deploy 'paths.json') -Raw | ConvertFrom-Json
```

生成两个文件，只生成配置，不安装、不启动：

- `paths.json`：DSH 目录、建议的记忆目录、人设和自我档案的位置，以及要安装的插件清单。
- `dsh.patch.yml`：人设插件的配置（自我档案路径、记忆状态目录）。记忆插件不需要在这里配置，首次配置在页面上完成。

## 3. 安装插件

先让当前终端指向这套部署（只设置环境变量，不启动服务）：

```powershell
. (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy
```

再安装固定版本的两个插件：

```powershell
$memoryCommit = 'fe12796708da39d737bdd8d475cd16cb17b54fe0'   # dsh-memory-starter 0.5.0
$settingsCommit = 'f5778e8a7ddcf2be5ba83f895db587b384455a78' # dsh-global-settings 0.2.0
dsh plugin --profile web add "github:XRH66/dsh-memory-starter#$memoryCommit"
dsh plugin --profile web add "github:XRH66/dsh-global-settings#$settingsCommit"
```

人设插件可以不装；不装时记忆照常工作，只是没有全局人设和状态面板。

## 4. 人设与自我档案（可选）

复制虚构的起始示例，之后改成自己的内容。已有文件时命令会停下，不会覆盖：

```powershell
if ((Test-Path -LiteralPath $paths.persona) -or (Test-Path -LiteralPath $paths.selfProfile)) { throw '已有人设或自我档案，请先查看，不要覆盖' }
New-Item -ItemType Directory -Force (Split-Path $paths.persona) | Out-Null
Copy-Item (Join-Path $starter 'examples/persona.md') $paths.persona
Copy-Item (Join-Path $starter 'examples/self-profile.md') $paths.selfProfile
```

## 5. 启动并完成首次配置

```powershell
& (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy -Start
```

DSH 在本机 8931 端口启动，打开启动日志给出的登录地址。端口被占用时，先确认是不是自己的旧实例，不要停掉不认识的程序。

1. 在 DSH 里配置你自己的模型服务。
2. 打开设置里的「记忆框架」。首次只有一个配置页：记忆目录填 `paths.json` 里的 `memoryDirectory`（也可以换成别的绝对路径，但不能和已有的记忆库重叠），选负责后台整理的模型服务和型号，再勾选至少一个对话（打开 DSH 页面时通常已有一个空白的「新会话」），点启用。
3. 按页面提示停止 DSH，再用上面的命令重新启动。之后「记忆框架」会出现「记忆／检索模型／状态／维护」四页。
4. 在「记忆」页给要记的对话打开记忆，从下一回合开始生效。也可以打开「新对话自动开启记忆」。时区默认北京时间，可在同一页修改。
5. 向量检索是可选的。先在「记忆」页打开「原话检索」，再到「检索模型」页选模型：本地模型（Qwen3-Embedding 0.6B／4B／8B 等）可以在页面上下载；接口模型选「自定义 API」，填 OpenAI 兼容的地址、模型名、维数和密钥（例如硅基流动的 `BAAI/bge-m3`）。保存后在「状态」页点「准备索引」。不配向量模型时，全文检索和条目检索照常可用。

记忆正文在记忆目录的 `vault/` 下，可以用 Obsidian 当作 Vault 打开；`management/` 存原话库、索引和状态，不要手动修改。

## 新开终端时

```powershell
$starter = (Resolve-Path '<主仓库目录>').Path
$deploy = Join-Path $env:LOCALAPPDATA 'dsh-memory-deployment'
. (Join-Path $starter 'scripts/use-deployment.ps1') -Deployment $deploy
```

把尖括号换成实际目录。点调用只设置当前终端的环境变量，不启动服务；加 `-Start` 才启动。

## 接入已有的 DSH

不想另起一套时，也可以直接在现用的 DSH 档案里执行第 3 步的 `dsh plugin add`（不要设置 `DSH_HOME`），重启后同样在「记忆框架」页面完成首次配置。记忆目录要用一个新目录。动现用实例前，先确认没有对话或后台任务在跑。

验证范围见 [验证记录](validation.md)。
