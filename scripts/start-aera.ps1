$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$release = Join-Path $root "vendor\aera\Release"
$executable = Join-Path $release "AERA.exe"
$settings = Join-Path $root "aera\settings.xml"

if (!(Test-Path $executable)) { throw "AERA no está compilado. Ejecuta npm run aera:build." }
Start-Process -FilePath $executable -ArgumentList ('"' + $settings + '"') `
  -WorkingDirectory $release -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $release "genesis_aera_stdout.log") `
  -RedirectStandardError (Join-Path $release "genesis_aera_stderr.log") -PassThru
