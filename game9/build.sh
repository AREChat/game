#!/bin/sh
# ===== GAME9 の物理エンジン（cpp/game9.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。
# つかいかた: このフォルダ（game9/）で   sh build.sh
# できるもの: js/game9.wasm.js（読みこみ用スクリプト）と js/game9.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/game9.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=Game9Module -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_g9_start_stage,_g9_step,_g9_get_buffer,_game9_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o js/game9.wasm.js
echo "✔ js/game9.wasm.js / js/game9.wasm.wasm を作りました"
