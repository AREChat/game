#!/bin/sh
# ===== ARE CARD の CPU思考エンジン（cpp/card_ai.cpp）を WebAssembly に ビルドする =====
# ひつよう: Emscripten（emsdk）。 game8/build.sh と同じ。
# つかいかた: このフォルダ（game4/card/）で   sh build.sh
# できるもの: js/cardai.wasm.js（読みこみ用スクリプト）と js/cardai.wasm.wasm（本体）
set -e
cd "$(dirname "$0")"
emcc cpp/card_ai.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=CardAIModule -s ENVIRONMENT=web \
  -s ALLOW_MEMORY_GROWTH=0 -s TOTAL_STACK=1048576 -s INITIAL_MEMORY=16777216 \
  -s EXPORTED_FUNCTIONS=_card_ctx_reset,_card_ctx_set_me_base,_card_ctx_set_foe_base,_card_ctx_set_my_unit,_card_ctx_set_foe_unit,_card_ctx_set_hand_cost,_card_ai_score_unit,_card_ai_score_spell,_card_ai_score_attack,_card_ai_noise,_card_ai_ask_are,_card_ai_seed,_card_ai_ping,_malloc,_free \
  -s EXPORTED_RUNTIME_METHODS=cwrap,ccall \
  -o js/cardai.wasm.js
echo "✔ js/cardai.wasm.js / js/cardai.wasm.wasm を作りました"
