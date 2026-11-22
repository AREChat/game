#!/bin/sh
# ===== GAME8 の物理エンジン（cpp/game8.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。 まだ入れていなければ:
#   git clone https://github.com/emscripten-core/emsdk.git && cd emsdk && ./emsdk install latest && ./emsdk activate latest
#   source ./emsdk_env.sh
# つかいかた: このフォルダ（game8/）で   sh build.sh
# できるもの: js/game8.wasm.js（読みこみ用スクリプト）と js/game8.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/game8.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=Game8Module -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_act_reset,_act_add_platform,_act_add_enemy,_act_add_coin,_act_set_goal,_act_step,_act_get_buffer,_race_reset,_race_add_waypoint,_race_set_width,_race_add_car,_race_add_itembox,_race_step,_race_get_buffer,_game8_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o js/game8.wasm.js
echo "✔ js/game8.wasm.js / js/game8.wasm.wasm を作りました"
