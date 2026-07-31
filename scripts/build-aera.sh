#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$root/vendor/aera"
release_dir="$source_dir/Release"

for command in cmake protoc; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Falta $command. Instala CMake y Protobuf antes de ejecutar npm run aera:build." >&2
    exit 1
  }
done

mkdir -p "$root/.tools"
working_source="$(mktemp -d "$root/.tools/aera-source.XXXXXX")"
trap 'rm -rf "$working_source"' EXIT
cp -R "$source_dir/." "$working_source"
proto_dir="$working_source/AERA/IODevices/TCP/AERA_Protobuf"

node --input-type=module - "$working_source/CMakeLists.txt" <<'NODE'
import fs from "node:fs";
const file = process.argv[2];
const cmake = fs.readFileSync(file, "utf8");
const legacy = /set_target_properties\(aera PROPERTIES COMPILE_OPTIONS "-m32" LINK_FLAGS "-m32"\)\s*link_directories\(\/usr\/lib\/i386-linux-gnu\)\s*target_link_libraries\(aera stdc\+\+fs libprotobuf\.a\)/;
const portable = `find_package(Protobuf REQUIRED)
set_target_properties(aera PROPERTIES CXX_STANDARD 17 CXX_STANDARD_REQUIRED YES)
option(AERA_32BIT "Build AERA for 32-bit Linux when the toolchain is available" OFF)
if (AERA_32BIT AND CMAKE_SYSTEM_NAME STREQUAL "Linux")
  set_target_properties(aera PROPERTIES COMPILE_OPTIONS "-m32" LINK_FLAGS "-m32")
  link_directories(/usr/lib/i386-linux-gnu)
endif()
target_link_libraries(aera PRIVATE protobuf::libprotobuf)`;
if (!legacy.test(cmake)) throw new Error("No se encontró la configuración CMake esperada de AERA.");
fs.writeFileSync(file, cmake.replace(legacy, portable));
NODE

protoc --proto_path="$proto_dir" --cpp_out="$proto_dir" "$proto_dir/tcp_data_message.proto"
build_dir="$working_source/build"
cmake -S "$working_source" -B "$build_dir" -DCMAKE_BUILD_TYPE=Release
cmake --build "$build_dir" --config Release --parallel

executable="$build_dir/aera"
if [[ ! -x "$executable" ]]; then
  executable="$build_dir/Release/aera"
fi
if [[ ! -x "$executable" ]]; then
  echo "La compilación terminó sin generar el ejecutable AERA." >&2
  exit 1
fi

mkdir -p "$release_dir"
install -m 755 "$executable" "$release_dir/AERA"
echo "AERA compilado: $release_dir/AERA"
