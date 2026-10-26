[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Deployment,
    [switch]$Start
)

$ErrorActionPreference = 'Stop'
$deploymentPath = (Resolve-Path -LiteralPath $Deployment).Path
$paths = Get-Content -LiteralPath (Join-Path $deploymentPath 'paths.json') -Raw | ConvertFrom-Json
$tokenPath = Join-Path $deploymentPath 'mcp-token.private'
if (-not (Test-Path -LiteralPath $tokenPath)) {
    if (-not $Start) { throw 'Start this deployment first to create its local control token.' }
    $newToken = & node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
    if ($LASTEXITCODE -ne 0) { throw 'Could not generate the control token.' }
    [IO.File]::WriteAllText($tokenPath, $newToken)
}
$env:DSH_HOME = $paths.harnessHome
$env:DSH_AGENTS_HOME = $paths.harnessHome
$env:DSH_MEMORY_VAULT = $paths.vault
$env:BASIC_MEMORY_CONFIG_DIR = Join-Path $deploymentPath 'basic-memory-state'
$env:DSH_MCP_CONTROL_TOKEN = (Get-Content -LiteralPath $tokenPath -Raw).Trim()
if ($env:DSH_MCP_CONTROL_TOKEN -notmatch '^[a-f0-9]{64}$') { throw 'Invalid deployment token file; do not overwrite an existing credential.' }
$env:DSH_MCP_URL = 'http://127.0.0.1:8931/mcp'
$env:DSH_CODEX_CONFIG = Join-Path $deploymentPath 'codex.mcp.toml'
$env:DSH_STARTER_ROOT = Split-Path $PSScriptRoot
if ($Start) {
    & dsh --profile web --patch (Join-Path $deploymentPath 'dsh.patch.yml') --host 127.0.0.1 --port 8931 --no-open
    if ($LASTEXITCODE -ne 0) { throw "Harness exited with code $LASTEXITCODE" }
} else {
    Write-Host 'Deployment environment loaded for this PowerShell session. No service was started.'
}
