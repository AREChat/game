#!/bin/sh
# ===== ARE QUEST（トップレベル本編）のバトル核心ロジック（cpp/game.cpp）を
#       WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。game8/build.sh の説明を参照。
# つかいかた: このフォルダ（game/）で   sh build.sh
# できるもの: game.wasm.js（読みこみ用スクリプト）と game.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/game.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=GameCoreModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=262144 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_g_damage,_g_weighted_pick,_g_turn_order,_game_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32,HEAP32 \
  -o game.wasm.js
echo "✔ game.wasm.js を作りました"
