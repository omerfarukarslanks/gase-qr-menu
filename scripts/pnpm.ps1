param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nodeDir = Join-Path $root ".tools\node-v20.20.1-win-x64"
$pnpmCmd = Join-Path $root ".tools\pnpm-global\pnpm.cmd"

if (-not (Test-Path $pnpmCmd)) {
  throw "Local pnpm not found at $pnpmCmd"
}

$env:Path = "$nodeDir;$(Split-Path $pnpmCmd -Parent);$env:Path"

& $pnpmCmd @Args
exit $LASTEXITCODE
