#!/bin/sh
# ===== ARE QUEST 2 / 3 共通の 物理コア（cpp/quest.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。game8/build.sh の説明を参照。
# つかいかた: このフォルダ（game2/）で   sh build.sh
# できるもの: quest.wasm.js（読みこみ用スクリプト）と quest.wasm.wasm（本体）
#            quest2/js/ と quest3/js/ の 両方に 同じものを置く（2本のゲームで共有）
set -e
cd "$(dirname "$0")"
emcc cpp/quest.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=QuestModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=524288 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_q_world_reset,_q_set_bounds,_q_add_rect,_q_add_circle,_q_hit,_q_move,_q_free_spot,_q_damage,_quest_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o quest2/js/quest.wasm.js
cp quest2/js/quest.wasm.js quest3/js/quest.wasm.js
cp quest2/js/quest.wasm.wasm quest3/js/quest.wasm.wasm
echo "✔ quest2/js/quest.wasm.js と quest3/js/quest.wasm.js を作りました"
