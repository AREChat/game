#!/bin/sh
# ===== ドリーム・フロンティア（dream-frontier）の移動・当たり判定エンジン（cpp/dream-frontier.cpp）を =====
# ===== WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。
# つかいかた: このフォルダ（dream-frontier/）で   sh build.sh
# できるもの: js/dreamfrontier.wasm.js（読みこみ用スクリプト）と js/dreamfrontier.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/dream-frontier.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=DreamFrontierModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_df_reset_solids,_df_add_solid,_df_set_bounds,_df_move,_dreamfrontier_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall,HEAPF32 \
  -o js/dreamfrontier.wasm.js
echo "✔ js/dreamfrontier.wasm.js / js/dreamfrontier.wasm.wasm を作りました"
