$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$protoDir = Join-Path $root "vendor\aera\AERA\IODevices\TCP\AERA_Protobuf"
$backupDir = Join-Path $root ".tools\aera-protobuf-backup"
$vcpkg = Join-Path $root ".tools\vcpkg"
$msbuild = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"

if (!(Test-Path "$vcpkg\vcpkg.exe")) { throw "Falta .tools/vcpkg/vcpkg.exe" }
if (!(Test-Path "$vcpkg\installed\x86-windows\lib\libprotobuf.lib")) {
  & "$vcpkg\vcpkg.exe" install protobuf:x86-windows
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item "$protoDir\tcp_data_message.pb.h" $backupDir -Force
Copy-Item "$protoDir\tcp_data_message.pb.cc" $backupDir -Force

try {
  & "$vcpkg\installed\x86-windows\tools\protobuf\protoc.exe" `
    "--proto_path=$protoDir" "--cpp_out=$protoDir" "$protoDir\tcp_data_message.proto"
  if ($LASTEXITCODE -ne 0) { throw "protoc falló" }
  & $msbuild "$root\vendor\aera\AERA.sln" /m /t:Build /p:Configuration=Release `
    /p:Platform=Win32 /p:PlatformToolset=v143 /p:WindowsTargetPlatformVersion=10.0 /v:minimal
  if ($LASTEXITCODE -ne 0) { throw "La compilación de AERA falló" }
}
finally {
  Copy-Item "$backupDir\tcp_data_message.pb.h" $protoDir -Force
  Copy-Item "$backupDir\tcp_data_message.pb.cc" $protoDir -Force
}
