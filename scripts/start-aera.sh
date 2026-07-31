#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
release_dir="$root/vendor/aera/Release"
executable="$release_dir/AERA"
settings="$root/aera/settings.xml"
stdout_log="$release_dir/genesis_aera_stdout.log"
stderr_log="$release_dir/genesis_aera_stderr.log"

if [[ ! -x "$executable" ]]; then
  echo "AERA no está compilado. Ejecuta npm run aera:build." >&2
  exit 1
fi

nohup "$executable" "$settings" >"$stdout_log" 2>"$stderr_log" < /dev/null &
echo $! > "$release_dir/genesis_aera.pid"
echo "AERA iniciado (PID $(cat "$release_dir/genesis_aera.pid"))."
