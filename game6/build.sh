#!/bin/sh
# ===== 推理ゲーム2（game6）の パズル生成エンジン（cpp/game6.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。
# つかいかた: このフォルダ（game6/）で   sh build.sh
# できるもの: js/game6.wasm.js（読みこみ用スクリプト）と js/game6.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/game6.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=Game6Module -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_g6_make_puzzle,_game6_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o js/game6.wasm.js
echo "✔ js/game6.wasm.js / js/game6.wasm.wasm を作りました"
