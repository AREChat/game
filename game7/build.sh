#!/bin/sh
# ===== OFFLINE PARADISE（game7）のダッシュ物理エンジン（cpp/game7.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。
# つかいかた: このフォルダ（game7/）で   sh build.sh
# できるもの: js/game7.wasm.js（読みこみ用スクリプト）と js/game7.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/game7.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=Game7Module -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_dash_reset,_dash_tap,_dash_slide,_dash_step,_dash_get_buffer,_dash_consume_gotcoins,_dash_consume_obsevents,\
_castle_reset,_castle_tap,_castle_step,_castle_get_buffer,_castle_consume_events,\
_dungeon_reset,_dungeon_swipe,_dungeon_get_buffer,_dungeon_consume_events,\
_beat_reset,_beat_down,_beat_up,_beat_step,_beat_get_buffer,_beat_consume_events,\
_fever_reset,_fever_set_target,_fever_step,_fever_get_buffer,_fever_consume_got,\
_game7_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o js/game7.wasm.js
echo "✔ js/game7.wasm.js / js/game7.wasm.wasm を作りました"
